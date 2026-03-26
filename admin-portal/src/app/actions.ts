'use server';

import { adminFirestore, admin } from '@/firebase/server-init';
import { Resend } from 'resend';
import { UserProfile, ScanStudentCardInput } from '@/types';

const FieldValue = admin.firestore.FieldValue;

async function callFirebaseFlow(flowName: string, data: any) {
  const adminSecret = process.env.CRON_SECRET || "dev-secret-123";
  const projectId = 'studio-7870211338-fe921';
  
  const prodBaseUrl = `https://runaiflow-7pguetq4hq-uc.a.run.app`; 
  const flowPath = "/runAiFlow";
  
  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? (prodBaseUrl + flowPath)
    : `http://127.0.0.1:5001/${projectId}/us-central1/runAiFlow`;

  const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
    ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + flowPath)
    : fallbackUrl;

  const performFetch = async (targetUrl: string) => {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminSecret
      },
      body: JSON.stringify({ flowName, data })
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            try {
                const errorJson = await response.json();
                errorMsg = errorJson.error || errorJson.message || errorMsg;
            } catch (e) {}
        } else {
            const text = await response.text().catch(() => "");
            if (text) errorMsg = text;
        }
        
        console.error(`Firebase Flow [${flowName}] call failed at ${targetUrl}:`, errorMsg);
        throw new Error(`AI Scan Fejl (${response.status}): ${errorMsg}`);
    }

    return response.json();
  };

  try {
    return await performFetch(url);
  } catch (error: any) {
    const isConnRefused = error.cause && error.cause.code === 'ECONNREFUSED';
    const isTargetingLocal = url.includes('127.0.0.1') || url.includes('localhost');

    if (isConnRefused && isTargetingLocal && process.env.NODE_ENV !== 'production') {
        const prodUrl = prodBaseUrl + flowPath;
        console.warn(`[Genkit) Emulator NOT found at ${url}. Falling back to production flows at ${prodUrl}.`);
        return await performFetch(prodUrl);
    }
    
    console.error("Firebase Flow client error:", error);
    throw error;
  }
}

const wrapEmailHtml = (inner: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .content { padding: 40px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">${inner}</div>
        <div class="footer">Sendt af Cohéro Admin Portal</div>
    </div>
</body>
</html>
`;

export async function sendInAppNotificationAction(input: { uid: string, title: string, body: string, type: string, link?: string }) {
    try {
        await adminFirestore.collection('users').doc(input.uid).collection('notifications').add({
            title: input.title,
            body: input.body,
            type: input.type,
            link: input.link || '',
            read: false,
            createdAt: FieldValue.serverTimestamp()
        });

        await adminFirestore.collection('notifications_queue').add({
            title: input.title,
            body: input.body,
            recipientUids: [input.uid],
            sentBy: 'system',
            targetGroup: 'private',
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send notification:', error);
        return { success: false };
    }
}

export async function sendStreakReminderEmailAction(input: { userEmail: string, userName: string, streakCount: number, userId: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateStreakReminderEmailFlow', { ...input });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });

        await sendInAppNotificationAction({
            uid: input.userId,
            title: "Hold din streak i live! 🔥",
            body: `Du har en streak på ${input.streakCount} dage. Log ind i dag for at holde den kørende!`,
            type: 'warning',
            link: '/'
        });

        return { success: true, message: "Streak reminder sent." };
    } catch (error) {
        console.error('Failed to send streak reminder:', error);
        return { success: false, message: "Failed to send streak reminder." };
    }
}

export async function queueNotificationAction(input: { title: string, body: string, recipientUids: string[], sentBy: string, targetGroup: string }) {
    try {
        await adminFirestore.collection('notifications_queue').add({
            ...input,
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function scanStudentCardAction(input: ScanStudentCardInput): Promise<any> {
    try {
        return await callFirebaseFlow('scanStudentCardFlow', input);
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateStudentCardVerificationAction(userId: string, verification: any) {
    try {
        await adminFirestore.collection('users').doc(userId).update({
            studentCardVerification: verification
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function toggleMarketplaceBanAction(userId: string, isBanned: boolean, reason?: string) {
    try {
        await adminFirestore.collection('users').doc(userId).update({
            isMarketplaceBanned: isBanned,
            marketplaceBanReason: reason || null
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function clearUserPaymentInfoAction(userId: string, studentCardUrl?: string) {
    try {
        const update: any = {
            cprNumber: FieldValue.delete(),
            bankReg: FieldValue.delete(),
            bankAccount: FieldValue.delete(),
            studentCardUrl: FieldValue.delete(),
            studentCardVerification: FieldValue.delete(),
        };
        await adminFirestore.collection('users').doc(userId).update(update);
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
