
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, getMembershipFromPriceId } from '@/lib/stripe';
import { initializeServerFirebase, admin } from '@/firebase/server-init';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Error constructing webhook event: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    const { firestore } = initializeServerFirebase();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Handle Shop One-time Payment
          if (session.mode === 'payment' && session.metadata?.type === 'shop_purchase' && session.metadata?.orderId) {
             const orderId = session.metadata.orderId;
             const orderRef = firestore.collection('shop_orders').doc(orderId);
             
             // 1. Get the order data to know which items were bought
             const orderSnap = await orderRef.get();
             if (orderSnap.exists()) {
                const orderData = orderSnap.data();
                const items = orderData?.items || [];
                
                // 2. Update stock for each item in shop_products
                const batch = firestore.batch();
                for (const item of items) {
                    if (item.id) {
                        const productRef = firestore.collection('shop_products').doc(item.id);
                        batch.update(productRef, {
                            stock: admin.firestore.FieldValue.increment(-item.quantity)
                        });
                    }
                }
                await batch.commit();
                console.log(`[StripeWebhook] Updated stock for order ${orderId}`);
             }

             await orderRef.update({
                paymentStatus: 'paid',
                stripeSessionId: session.id,
                shippingDetails: session.shipping_details || null,
                customerDetails: {
                    name: session.customer_details?.name || null,
                    email: session.customer_details?.email || null,
                    phone: session.customer_details?.phone || null,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
             });
             break;
          }

          const userId = session.client_reference_id || session.metadata?.userId;
          
          if (session.mode === 'subscription' && session.subscription && userId) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const userRef = firestore.collection('users').doc(userId);
            const price = subscription.items.data[0].price;
            const membershipLevel = getMembershipFromPriceId(price.id);
            
            await userRef.set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: price.id,
                stripeSubscriptionStatus: subscription.status,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                membership: membershipLevel,
                stripeCancelAtPeriodEnd: false,
            }, { merge: true });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userRefSnap = await firestore.collection('users').where('stripeCustomerId', '==', subscription.customer).get();
          
          if (!userRefSnap.empty) {
            const userDoc = userRefSnap.docs[0];
            const price = subscription.items.data[0].price;
            const membershipLevel = getMembershipFromPriceId(price.id);

            const updateData: any = {
                stripeSubscriptionStatus: subscription.status,
                stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            };

            // Reactivate membership logic
            if (subscription.status === 'active' || subscription.status === 'trialing') {
                updateData.membership = membershipLevel;
                updateData.stripePriceId = price.id;
            } else if (subscription.status === 'unpaid' || subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
                // Before downgrading, check if they have ANOTHER active/trialing subscription.
                const subs = await stripe.subscriptions.list({
                    customer: subscription.customer as string,
                    status: 'active',
                });
                const trials = await stripe.subscriptions.list({
                    customer: subscription.customer as string,
                    status: 'trialing',
                });

                // We only downgrade if there are ZERO active/trialing subs remaining for this customer.
                // We exclude the current one from the check if it's currently considered active/trialing, 
                // but since we are in the 'past_due' etc branch, it's already NOT in those lists or will be soon.
                const totalActive = subs.data.length + trials.data.length;
                if (totalActive === 0) {
                     updateData.membership = 'Kollega';
                }
            }

            await userDoc.ref.set(updateData, { merge: true });
          }
          break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                const userRefSnap = await firestore.collection('users').where('stripeCustomerId', '==', invoice.customer).get();
                
                if (!userRefSnap.empty) {
                    const userDoc = userRefSnap.docs[0];
                    const price = subscription.items.data[0].price;
                    const membershipLevel = getMembershipFromPriceId(price.id);

                    await userDoc.ref.set({
                        membership: membershipLevel,
                        stripeSubscriptionStatus: 'active',
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                        stripeLastPaymentFailed: false, // Reset failure flag
                        stripeLastPaymentError: null
                    }, { merge: true });
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const userRefSnap = await firestore.collection('users').where('stripeCustomerId', '==', invoice.customer).get();
            
            if (!userRefSnap.empty) {
                const userDoc = userRefSnap.docs[0];
                
                // CRITICAL: Before downgrading, check if they have ANOTHER active/trialing subscription.
                const subscriptions = await stripe.subscriptions.list({
                    customer: invoice.customer as string,
                    status: 'active',
                });
                const trialingSubscriptions = await stripe.subscriptions.list({
                    customer: invoice.customer as string,
                    status: 'trialing',
                });

                const totalActiveCount = subscriptions.data.length + trialingSubscriptions.data.length;

                if (totalActiveCount === 0) {
                     // Only downgrade if they have NO other valid subscriptions
                     await userDoc.ref.set({
                        membership: 'Kollega',
                        stripeLastPaymentFailed: true,
                        stripeLastPaymentError: invoice.last_finalization_error?.message || 'Payment failed'
                    }, { merge: true });
                } else {
                    // They have another active sub, so just log the failure but don't downgrade
                    await userDoc.ref.set({
                        stripeLastPaymentFailed: true,
                        stripeLastPaymentError: invoice.last_finalization_error?.message || 'Payment failed (but other active subscription found)'
                    }, { merge: true });
                }
            }
            break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userRefSnap = await firestore.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();

          if (!userRefSnap.empty) {
              const userDoc = userRefSnap.docs[0];
              
              const updateData: any = {
                  stripeSubscriptionStatus: subscription.status,
                  stripeCancelAtPeriodEnd: null,
                  stripeCurrentPeriodEnd: null,
                  stripePriceId: null,
                  stripeSubscriptionId: null,
              };

              // Check if they have ANY other active subscriptions before removing membership
              const activeSubs = await stripe.subscriptions.list({
                  customer: subscription.customer as string,
                  status: 'active',
              });
              const activeTrials = await stripe.subscriptions.list({
                  customer: subscription.customer as string,
                  status: 'trialing',
              });

              if (activeSubs.data.length === 0 && activeTrials.data.length === 0) {
                  updateData.membership = 'Kollega';
              }

              await userDoc.ref.set(updateData, { merge: true });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Webhook handler failed.', error);
      return new NextResponse('Webhook handler failed. View logs.', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
