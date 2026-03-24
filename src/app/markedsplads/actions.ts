'use server';

import { adminFirestore } from '@/firebase/server-init';
import { resend } from '@/lib/resend';
import { stripe } from '@/lib/stripe';
import { AssistanceRequest } from '@/ai/flows/types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const PLATFORM_FEE_PERCENT = 15;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cohero.dk';

/**
 * Creates a new assistance request and sends confirmation email.
 */
export async function createAssistanceRequestAction(formData: {
  title: string;
  description: string;
  category: AssistanceRequest['category'];
  price: number;
  location: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
}) {
  try {
    const platformFee = Math.round(formData.price * (PLATFORM_FEE_PERCENT / 100));
    const studentEarnings = formData.price - platformFee;

    const requestData = {
      ...formData,
      status: 'open' as const,
      isPaid: false,
      createdAt: FieldValue.serverTimestamp(),
      platformFee,
      studentEarnings,
      location: formData.location || 'Online',
    };

    const docRef = await adminFirestore.collection('assistance_requests').add(requestData);
    const requestId = docRef.id;

    console.log('Assistance request created in Firestore:', requestId);

    return { success: true, id: requestId };
  } catch (error) {
    console.error('Error in createAssistanceRequestAction:', error);
    return { success: false, error: 'Kunne ikke oprette anmodningen.' };
  }
}

/**
 * Claims an assistance request for a student.
 */
export async function claimAssistanceRequestAction(requestId: string, student: { uid: string; name: string }) {
  try {
    const docRef = adminFirestore.collection('assistance_requests').doc(requestId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new Error('Request not found');
    const request = docSnap.data() as AssistanceRequest;

    if (request.status !== 'open') throw new Error('Opgaven er allerede påtaget eller afsluttet.');

    await docRef.update({
      status: 'claimed',
      studentId: student.uid,
      studentName: student.name,
      claimedAt: FieldValue.serverTimestamp(),
    });

    console.log('Assistance request claimed in Firestore:', requestId);

    revalidatePath('/markedsplads');
    return { success: true };
  } catch (error) {
    console.error('Error in claimAssistanceRequestAction:', error);
    return { success: false, error: 'Kunne ikke påtage opgaven.' };
  }
}

/**
 * Creates a Stripe Checkout session for the request.
 */
export async function createStripeCheckoutForRequestAction(requestId: string) {
  try {
    const docSnap = await adminFirestore.collection('assistance_requests').doc(requestId).get();
    if (!docSnap.exists) throw new Error('NotFound');
    const request = docSnap.data() as AssistanceRequest;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'dkk',
            product_data: {
              name: `Hjælp til: ${request.title}`,
              description: `Vejledning og hjælp fra en socialrådgiverstuderende (${request.category})`,
            },
            unit_amount: request.price * 100, // Stripe uses cents/øre
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/raadgivning/status/${requestId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${APP_URL}/raadgivning/status/${requestId}?canceled=true`,
      customer_email: request.citizenEmail,
      metadata: {
        requestId,
      },
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error('Error in createStripeCheckoutForRequestAction:', error);
    return { success: false, error: 'Stripe session could not be created.' };
  }
}

/**
 * Marks request as paid (e.g. called from success page if webhook delayed)
 */
export async function verifyAndMarkPaidAction(requestId: string, sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid' && session.metadata?.requestId === requestId) {
      await adminFirestore.collection('assistance_requests').doc(requestId).update({
        isPaid: true,
        stripeSessionId: sessionId
      });
      return { success: true };
    }
    return { success: false, error: 'Payment not confirmed' };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: 'Server error verifying payment' };
  }
}

/**
 * Marks a request as completed by the citizen.
 */
export async function completeAssistanceRequestAction(requestId: string, rating: number) {
  try {
    await adminFirestore.collection('assistance_requests').doc(requestId).update({
      status: 'completed',
      rating,
      completedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/markedsplads');
    revalidatePath(`/raadgivning/status/${requestId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error completing request:', error);
    return { success: false, error: 'Kunne ikke markere opgaven som udført.' };
  }
}
