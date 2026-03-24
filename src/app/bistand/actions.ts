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

    // Send confirmation email via Resend
    const statusUrl = `${APP_URL}/anmod-bistand/status/${requestId}`;

    await resend.emails.send({
      from: 'Cohéro Markedsplads <info@cohero.dk>',
      to: formData.citizenEmail,
      subject: `Din anmodning: ${formData.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e293b;">Din anmodning er modtaget!</h1>
          <p>Hej ${formData.citizenName},</p>
          <p>Tak fordi du har oprettet en anmodning på Cohéro Markedsplads. Vi har nu lagt din opgave op til vores studerende.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <strong style="display: block; margin-bottom: 5px;">${formData.title}</strong>
            <p style="margin: 0; color: #64748b;">Vi giver dig besked direkte på mail, så snart en studerende har taget din opgave.</p>
          </div>
          <p>Du kan altid følge med i status på din anmodning her:</p>
          <a href="${statusUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se status og betal senere</a>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Dette er en automatisk besked fra Cohéro. Gem venligst dette link, da det er din adgang til opgaven.</p>
        </div>
      `,
    });

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

    // Notify creator via Resend
    const statusUrl = `${APP_URL}/anmod-bistand/status/${requestId}`;

    await resend.emails.send({
      from: 'Cohéro Markedsplads <info@cohero.dk>',
      to: request.citizenEmail,
      subject: `En studerende har taget din opgave: ${request.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e293b;">Vi har fundet en hjælper!</h1>
          <p>Hej ${request.citizenName},</p>
          <p>Gode nyheder! Den socialrådgiverstuderende <strong>${student.name}</strong> har påtaget sig din opgave: <em>"${request.title}"</em>.</p>
          <p>For at frigive jeres kontaktoplysninger til hinanden og starte samarbejdet, skal du nu gennemføre betalingen.</p>
          <a href="${statusUrl}" style="display: inline-block; background: #059669; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">Gå til betaling nu</a>
          <p>Når betalingen er gennemført, får du direkte adgang til at kontakte den studerende.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Cohéro Markedsplads &ndash; hjælper borgere og studerende med at finde hinanden.</p>
        </div>
      `,
    });

    revalidatePath('/bistand');
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
      success_url: `${APP_URL}/anmod-bistand/status/${requestId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${APP_URL}/anmod-bistand/status/${requestId}?canceled=true`,
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
