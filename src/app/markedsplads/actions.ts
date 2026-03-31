'use server';

import { adminFirestore } from '@/firebase/server-init';
import { resend } from '@/lib/resend';
import { stripe } from '@/lib/stripe';
import { AssistanceRequest } from '@/ai/flows/types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { wrapEmailHtml } from '@/app/actions';

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
  dueDate: string;
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

    // Send confirmation email to citizen with status link
    try {
      const statusLink = `${APP_URL}/raadgivning/status/${requestId}`;
      await resend.emails.send({
        from: 'Cohéro Rådgivning <info@platform.cohero.dk>',
        to: formData.citizenEmail,
        subject: "Vi har modtaget din anmodning! 🚀",
        html: wrapEmailHtml(`
            <h1 style="color: #0f172a; margin-bottom: 16px;">Hej ${formData.citizenName || 'Borger'}</h1>
            <p>Vi har nu modtaget din anmodning om hjælp til opgaven: <strong>"${formData.title}"</strong>.</p>
            <p>Din anmodning er nu lagt ud på vores markedsplads, hvor dygtige socialrådgiverstuderende kan se den. Du får en e-mail så snart en studerende har takket ja til at hjælpe dig.</p>
            <p>Du kan løbende følge status på din sag og se næste skridt via din personlige status-side:</p>
            <div style="margin-top: 32px; text-align: center;">
                <a href="${statusLink}" style="background-color: #451a03; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Gå til din status-side</a>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 24px; font-style: italic;">Har du spørgsmål til processen? Skriv til os på <a href="mailto:kontakt@cohero.dk" style="color: #451a03; font-weight: bold;">kontakt@cohero.dk</a> – vi står klar til at hjælpe dig.</p>
        `),
      });
      console.log('Confirmation email sent to:', formData.citizenEmail);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // We don't fail the whole action if email fails, but it's logged
    }

    return { success: true, id: requestId };
  } catch (error) {
    console.error('Error in createAssistanceRequestAction:', error);
    return { success: false, error: 'Kunne ikke oprette anmodningen.' };
  }
}

/**
 * Claims an assistance request for a student.
 */
export async function claimAssistanceRequestAction(requestId: string, student: { uid: string; name: string; phone?: string }) {
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
      studentPhone: student.phone || '',
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
