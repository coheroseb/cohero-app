
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { initializeServerFirebase } from '@/firebase/server-init';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
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
          const userId = session.client_reference_id;
          
          if (session.mode === 'subscription' && session.subscription && userId) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const userRef = firestore.collection('users').doc(userId);
            const price = subscription.items.data[0].price;
            let membershipLevel = price.nickname || 'Kollega+';

            // Explicit mapping for specific price IDs to ensure reliability
            if (price.id === process.env.STRIPE_GROUP_PRO_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID) {
                membershipLevel = 'Group Pro';
            } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID) {
                membershipLevel = 'Kollega+';
            } else if (price.id === process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID) {
                membershipLevel = 'Semesterpakken';
            } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID) {
                membershipLevel = 'Kollega++';
            }
            
            await userRef.set({
                stripeSubscriptionId: subscription.id,
                stripePriceId: price.id,
                stripeSubscriptionStatus: subscription.status,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                membership: membershipLevel,
                stripeCancelAtPeriodEnd: false,
            }, { merge: true });
          } else {
             console.warn(`Webhook: checkout.session.completed event missing client_reference_id.`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userRefSnap = await firestore.collection('users').where('stripeCustomerId', '==', subscription.customer).get();
          
          if (!userRefSnap.empty) {
            const userDoc = userRefSnap.docs[0];
            const price = subscription.items.data[0].price;
            let membershipLevel = price.nickname || 'Kollega+';

            if (price.id === process.env.STRIPE_GROUP_PRO_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID) {
                membershipLevel = 'Group Pro';
            } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID) {
                membershipLevel = 'Kollega+';
            } else if (price.id === process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID) {
                membershipLevel = 'Semesterpakken';
            } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID) {
                membershipLevel = 'Kollega++';
            }

            const updateData: any = {
                stripeSubscriptionStatus: subscription.status,
                stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            };

            // If a user has re-enabled their subscription, ensure their membership is active.
            if (subscription.cancel_at_period_end === false && subscription.status === 'active') {
                updateData.membership = membershipLevel;
                updateData.stripePriceId = price.id;
            }

            await userDoc.ref.set(updateData, { merge: true });
          } else {
             console.warn(`Webhook: Could not find user for stripeCustomerId: ${subscription.customer} on update.`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userRefSnap = await firestore.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();

          if (!userRefSnap.empty) {
              const userDoc = userRefSnap.docs[0];
              await userDoc.ref.set({
                  stripeSubscriptionStatus: subscription.status,
                  membership: 'Kollega',
                  stripeCancelAtPeriodEnd: null,
                  stripeCurrentPeriodEnd: null,
                  stripePriceId: null,
                  stripeSubscriptionId: null,
              }, { merge: true });
          } else {
              console.warn(`Webhook: Could not find user for stripeSubscriptionId: ${subscription.id} on deletion.`);
          }
          break;
        }

        default:
          console.warn(`Webhook: Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handler failed.', error);
      return new NextResponse('Webhook handler failed. View logs.', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
