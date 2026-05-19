'use server';

// Polyfill for Promise.withResolvers to support older Node.js versions
import { extractTextFromPdf } from '@/lib/pdf-parser';
if (!Promise.withResolvers) {
    Promise.withResolvers = function withResolvers<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        // @ts-ignore
        return { promise, resolve, reject };
    };
}

import { safeIsoDate } from '@/lib/utils';
import { resend } from '@/lib/resend';
import https from 'https';
import { wrapEmailHtml } from '@/lib/email-helper';

import { repairJson } from '@/lib/json-repair';

function getGeminiApiKey(): string {
    const keys = [
        process.env.GEMINI_API_KEY,
        process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        "AIzaSyD93vIEVXUu9qv5o9GrMIbKJ-wJ1qUKtz4",
        "AIzaSyCEay9Ekv3ARVUncB6H1EDP35ALRe5PswA"
    ];
    for (const key of keys) {
        if (key && typeof key === 'string') {
            const sanitized = key.trim().replace(/^["']|["']$/g, '');
            if (sanitized && sanitized !== 'undefined' && sanitized !== 'null' && sanitized.startsWith('AIzaSy')) {
                return sanitized;
            }
        }
    }
    throw new Error("Ingen gyldig GEMINI_API_KEY fundet.");
}




























































import { adminFirestore, admin } from '@/firebase/server-init';
const FieldValue = admin.firestore.FieldValue;

import { uploadMediaToStorage } from '@/lib/storage-utils';





// Type Imports
import type * as Types from '@/ai/flows/types';
import {
    SeminarArchitectInput, SeminarArchitectOutput,
    TranslateSeminarInput, TranslateSeminarOutput,
    SeminarChatInput, SeminarChatOutput,
    AnalyzeCasePdfInput, AnalyzeCasePdfOutput
} from '@/ai/flows/types';

export async function callFirebaseFlow(flowName: string, data: any) {
  const adminSecret = process.env.CRON_SECRET || "dev-secret-123";
  const projectId = 'studio-7870211338-fe921';
  
  // 2nd Gen functions have a unique hash in the URL. 
  // We prioritize the environment variable if available.
  const prodBaseUrl = `https://runaiflow-7pguetq4hq-uc.a.run.app`; 
  const flowPath = "/runAiFlow";
  
  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? (prodBaseUrl + flowPath)
    : `http://127.0.0.1:5001/${projectId}/us-central1/runAiFlow`;

  const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
    ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + flowPath)
    : fallbackUrl;

  const performFetch = async (targetUrl) => {
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
            } catch (e) {
                // Ignore json parse error if we already tried it
            }
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
    console.log(`[AI Flow] Calling ${flowName} at ${url}...`);
    const result = await performFetch(url);
    // Sanitize to ensure POJO for Next.js Client boundary
    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    // If the emulator is not running, fail gracefully by trying the production URL in dev mode
    const isConnRefused = error.cause && error.cause.code === 'ECONNREFUSED';
    const isTargetingLocal = url.includes('127.0.0.1') || url.includes('localhost');

    if (isConnRefused && isTargetingLocal && process.env.NODE_ENV !== 'production') {
        const prodUrl = prodBaseUrl + flowPath;
        console.warn(`[AI Flow] Emulator NOT found at ${url}. Falling back to production flows at ${prodUrl}.`);
        return await performFetch(prodUrl);
    }
    
    console.error(`[AI Flow] Error calling ${flowName}:`, error);
    throw error;
  }
}

/**
 * redeemCodeAction:
 * Handles the server-side logic for redeeming internal Cohéro marketing codes.
 * This bypasses Firestore client-side permission issues as it uses the Admin SDK.
 */
export async function redeemCodeAction(input: { code: string, userId: string }) {
    const { code, userId } = input;
    const cleanCode = code.trim().toUpperCase();
    
    try {
        const redemptionRef = adminFirestore.collection('redemptionCodes');
        const q = await redemptionRef.where('code', '==', cleanCode).limit(1).get();
        
        if (q.empty) {
            throw new Error('Koden er ikke gyldig.');
        }
        
        const codeDoc = q.docs[0];
        const codeData = codeDoc.data();
        
        if (codeData.redeemedBy) {
            throw new Error('Koden er allerede blevet brugt.');
        }

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (codeData.durationInMonths || 1));

        const batch = adminFirestore.batch();
        
        // Mark code as used
        batch.update(codeDoc.ref, {
            redeemedBy: userId,
            redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Update user membership
        const userRef = adminFirestore.collection('users').doc(userId);
        batch.update(userRef, {
            membership: codeData.membershipLevel,
            stripeCurrentPeriodEnd: expiryDate.toISOString(),
            stripePriceId: `redeemed-${cleanCode}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        
        return { 
            success: true, 
            message: `Tillykke! Du har nu ${codeData.membershipLevel} indtil ${expiryDate.toLocaleDateString('da-DK')}.`,
            membership: codeData.membershipLevel
        };
    } catch (error: any) {
        console.error('Redemption error:', error);
        return { success: false, message: error.message || 'Der skete en fejl under indløsning.' };
    }
}

/**
 * syncAllSubscriptionsAction:
 * Admin tool to iterate through all paying users and ensure their 
 * Firestore status matches their actual Stripe subscription state.
 */
export async function syncAllSubscriptionsAction() {
    const logRef = adminFirestore.collection('systemLogs').doc();
    const startTime = new Date();
    
    try {
        // Find all users who have an active (or previously active) subscription ID
        const usersSnap = await adminFirestore.collection('users')
            .where('stripeSubscriptionId', '!=', null)
            .get();

        if (usersSnap.empty) {
            await logRef.set({
                type: 'payment_sync',
                status: 'completed',
                startTime: admin.firestore.Timestamp.fromDate(startTime),
                endTime: admin.firestore.FieldValue.serverTimestamp(),
                processedCount: 0,
                message: "Ingen betalende brugere fundet."
            });
            return { success: true, message: "Ingen betalende brugere fundet.", updatedCount: 0 };
        }

        let updatedCount = 0;
        let downgradeCount = 0;
        let errorCount = 0;
        const details: string[] = [];

        // Save initial state
        await logRef.set({
            type: 'payment_sync',
            status: 'running',
            startTime: admin.firestore.Timestamp.fromDate(startTime),
            details: []
        });

        // Sequence these slightly to avoid hitting Stripe rate limits if hundreds of users exist
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const subId = userData.stripeSubscriptionId;

            try {
                const subscription = await stripe.subscriptions.retrieve(subId as string);
                const price = subscription.items.data[0].price;
                const membershipLevel = getMembershipFromPriceId(price.id);

                const isActive = subscription.status === 'active' || subscription.status === 'trialing';
                const wasPaying = userData.membership !== 'Kollega' && userData.membership !== 'Gratis Plan';

                if (!isActive && wasPaying) {
                    const reason = `Stripe status: ${subscription.status}`;
                    details.push(`MANUAL DOWNGRADE: ${userData.email || userDoc.id}. Årsag: ${reason}`);
                    downgradeCount++;
                }

                await userDoc.ref.set({
                    stripeSubscriptionStatus: subscription.status,
                    membership: isActive ? membershipLevel : 'Kollega',
                    stripeCurrentPeriodEnd: safeIsoDate(subscription.current_period_end),
                    stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                updatedCount++;
            } catch (err: any) {
                console.error(`[SYNC-SUB] Failed for user ${userDoc.id}:`, err);
                details.push(`ERROR: Fejl ved ${userData.email || userDoc.id}: ${err.message}`);
                errorCount++;
            }
        }

        await logRef.update({
            status: errorCount > 0 ? 'completed_with_errors' : 'completed',
            endTime: admin.firestore.FieldValue.serverTimestamp(),
            processedCount: updatedCount,
            downgradeCount: downgradeCount,
            errorCount: errorCount,
            details: details.slice(0, 100)
        });

        return { 
            success: true, 
            message: `Synkronisering færdig: ${updatedCount} opdateret, ${downgradeCount} nedgraderet, ${errorCount} fejl.`,
            updatedCount,
            downgradeCount,
            errorCount
        };
    } catch (error: any) {
        console.error('Master sync failed:', error);
        await logRef.set({
            type: 'payment_sync',
            status: 'failed',
            startTime: admin.firestore.Timestamp.fromDate(startTime),
            endTime: admin.firestore.FieldValue.serverTimestamp(),
            error: error.message
        }, { merge: true });
        return { success: false, message: 'Kunne ikke fuldføre synkronisering.' };
    }
}

/**
 * getSystemLogsAction:
 * Fetches recent logs from the systemLogs collection.
 */
export async function getSystemLogsAction(type?: string, limitCount: number = 20) {
    try {
        let q = adminFirestore.collection('systemLogs')
            .orderBy('startTime', 'desc');
            
        if (type) {
            q = q.where('type', '==', type);
        }
        
        const snap = await q.limit(limitCount).get();
        return { 
            success: true, 
            data: snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startTime: doc.data().startTime?.toDate().toISOString(),
                endTime: doc.data().endTime?.toDate().toISOString(),
            }))
        };
    } catch (error: any) {
        console.error('Failed to fetch system logs:', error);
        return { success: false, message: error.message };
    }
}




import type Stripe from 'stripe';


// Third-party and utility imports
import { stripe, isStripeConfigured, getMembershipFromPriceId } from '@/lib/stripe';
import { adminFirestore as firestore, adminAuth as auth } from '@/firebase/server-init';
import { cookies, headers } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';

// --- UPDATED ACTION: Sync Calendar Availability (Month-based statistical plan) ---

/**
 * Fetches an iCal URL, analyzes the current month (or a custom range), and returns a 
 * template ugeplan based on statistical availability.
 */
export async function syncCalendarAvailability(
    icalUrl: string,
    customRange?: { start: string, end: string }
): Promise<{ 
    slots: Record<string, 'physical' | 'online' | 'unavailable' | null>, 
    busyEvents: { start: string, end: string, title: string }[] 
}> {
    const url = icalUrl.replace(/^webcal:\/\//i, 'https://');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Kunne ikke hente kalenderdata.');
    const icalText = await response.text();

    const dayNames = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    const timeSlots = ['morning', 'afternoon', 'evening'];

    // Determine range
    const now = new Date();
    const startRange = customRange ? new Date(customRange.start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endRange = customRange ? new Date(customRange.end) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Trackers
    const busyCounts: Record<string, number> = {}; // key: 'dayIndex-slot'
    const dayOccurrences: Record<number, number> = {}; // key: dayIndex (0-6)
    const busyEvents: { start: string, end: string, title: string }[] = [];

    // 1. Calculate how many of each weekday exist in the range
    for (let d = new Date(startRange); d <= endRange; d.setDate(d.getDate() + 1)) {
        const dayIdx = d.getDay();
        dayOccurrences[dayIdx] = (dayOccurrences[dayIdx] || 0) + 1;
    }

    // 2. Parse iCal events
    const events = icalText.split('BEGIN:VEVENT').slice(1);

    // We need to track busy days to avoid counting multiple events in one slot on same day twice
    const trackedBusySlots = new Set<string>(); // key: 'dateISO-slot'

    for (const eventBlock of events) {
        const startMatch = eventBlock.match(/DTSTART[:;](?:VALUE=DATE:)?(\d{8}(?:T\d{6}Z?)?)/);
        const endMatch = eventBlock.match(/DTEND[:;](?:VALUE=DATE:)?(\d{8}(?:T\d{6}Z?)?)/);
        const summaryMatch = eventBlock.match(/SUMMARY:(.*)/);

        if (!startMatch || !endMatch) continue;

        const parseDate = (str: string) => {
            const y = parseInt(str.substring(0, 4));
            const m = parseInt(str.substring(4, 6)) - 1;
            const d = parseInt(str.substring(6, 8));
            if (str.includes('T')) {
                const h = parseInt(str.substring(9, 11));
                const min = parseInt(str.substring(11, 13));
                return new Date(Date.UTC(y, m, d, h, min));
            }
            return new Date(Date.UTC(y, m, d));
        };

        const startDate = parseDate(startMatch[1]);
        const endDate = parseDate(endMatch[1]);
        const title = summaryMatch ? summaryMatch[1].trim() : 'Optaget';

        // Only process events within range
        if (endDate < startRange || startDate > endRange) continue;

        // Add to busyEvents for timeline
        busyEvents.push({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            title: title
        });

        const dayIdx = startDate.getDay();
        const startHour = startDate.getUTCHours();
        const endHour = endDate.getUTCHours();
        const dateKey = startDate.toISOString().split('T')[0];

        const markBusy = (slotId: string) => {
            const uniqueKey = `${dateKey}-${slotId}`;
            if (!trackedBusySlots.has(uniqueKey)) {
                trackedBusySlots.add(uniqueKey);
                const countKey = `${dayIdx}-${slotId}`;
                busyCounts[countKey] = (busyCounts[countKey] || 0) + 1;
            }
        };

        // Morning: 8-12
        if (startHour < 12 && endHour > 8) markBusy('morning');
        // Afternoon: 12-17
        if (startHour < 17 && endHour > 12) markBusy('afternoon');
        // Evening: 17-22
        if (startHour < 22 && endHour > 17) markBusy('evening');
    }

    // 3. Calculate statistical availability
    const slots: Record<string, 'physical' | 'online' | 'unavailable' | null> = {};

    for (let dIdx = 0; dIdx < 7; dIdx++) {
        const dayId = dayNames[dIdx];
        const occurrences = dayOccurrences[dIdx] || 1;

        for (const slotId of timeSlots) {
            const busyCount = busyCounts[`${dIdx}-${slotId}`] || 0;
            const busyRatio = busyCount / occurrences;
            const key = `${dayId}-${slotId}`;

            // SHARPER LOGIC:
            // If you are busy in > 30% of the days, don't promise availability
            if (busyRatio > 0.3) {
                slots[key] = 'unavailable';
            }
            // ONLY mark as physical if 100% free across the whole month on weekdays
            else if (busyRatio === 0 && dIdx !== 0 && dIdx !== 6) {
                slots[key] = 'physical';
            }
            // For everything else, default to null so the user has to make a conscious choice
            else {
                slots[key] = null;
            }
        }
    }

    return { slots, busyEvents };
}

// AI Actions (wrapping flows)
export async function recommendContentAction(input: any) { return callFirebaseFlow('recommendContentFlow', input); }



export async function getSecondOpinionAction(input: { 
    userId: string,
    profession?: string, 
    assignmentPdf?: string, // base64
    feedbackPdf?: string,   // base64
    [key: string]: any 
}) { 
    // 1. Upload files to Storage if provided
    let assignmentUrl = "";
    try {
        if (input.assignmentPdf) {
            const fileName = `assignments/${input.userId}/${Date.now()}_opgave.pdf`;
            assignmentUrl = await uploadMediaToStorage(input.assignmentPdf, fileName);
        }
    } catch (e) {
        console.error("Failed to upload assignment to storage:", e);
    }

    // 2. Fetch relevant decisions to provide context to the AI
    let decisionContext = "";
    try {
        if (adminFirestore) {
            let q = adminFirestore.collection('secondOpinionDecisions')
                .orderBy('createdAt', 'desc');
            
            if (input.profession) {
                const profSnap = await q.where('profession', '==', input.profession).limit(5).get();
                const generalSnap = await q.limit(5).get();
                
                const decisions = [
                    ...profSnap.docs.map(d => d.data()),
                    ...generalSnap.docs.map(d => d.data())
                ].slice(0, 8);

                if (decisions.length > 0) {
                    decisionContext = "TIDLIGERE AFGØRELSER (Brug disse til at forstå vægtning og outcome-mønstre):\n" + 
                        decisions.map(d => `- [${d.outcome?.toUpperCase() || 'UKENDT'}] ${d.title}: ${d.aiAnalysis?.criticalPoint || d.content?.substring(0, 200)}`).join('\n');
                }
            } else {
                const snap = await q.limit(10).get();
                const decisions = snap.docs.map(d => d.data());
                if (decisions.length > 0) {
                    decisionContext = "TIDLIGERE AFGØRELSER (Brug disse til at forstå vægtning og outcome-mønstre):\n" + 
                        decisions.map(d => `- [${d.outcome?.toUpperCase() || 'UKENDT'}] ${d.title}: ${d.aiAnalysis?.criticalPoint || d.content?.substring(0, 200)}`).join('\n');
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch decision context:", e);
    }

    // 3. Call AI Flow
    // We pass the Storage URL instead of the heavy base64 string to avoid body size limits and decoding errors.
    const flowInput = { 
        ...input, 
        assignmentPdfUrl: assignmentUrl,
        decisionContext 
    };
    // Remove the base64 strings to keep the request body small
    delete flowInput.assignmentPdf;
    delete flowInput.feedbackPdf;

    const result = await callFirebaseFlow('getSecondOpinionFlow', flowInput); 
    
    // Add the storage URL to the result so the frontend can save it
    return { ...result, fileUrl: assignmentUrl };
}


export async function getCaseFeedbackAction(input: { topic: string, scenario: string, initialObservation: string, assessment: string, goals: string, actionPlan: string, profession?: string }): Promise<Types.CaseFeedbackOutput> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes?.data || '';
    return callFirebaseFlow('getCaseFeedbackFlow', { ...input, lawContext });
}


export async function generateWelcomeEmailAction(input: { userName: string, userEmail: string }): Promise<{ success: boolean; message: string }> {
    try {
        const { data: { subject, body } } = await callFirebaseFlow('generateWelcomeEmailFlow', { userName: input.userName, userEmail: input.userEmail });
        await resend.emails.send({
            from: 'Cohéro <kontakt@cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: 'Welcome email sent.' };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return { success: false, message: 'Failed to send welcome email.' };
    }
}

function sendResendEmailRaw(payload: {
    from: string;
    to: string;
    subject: string;
    html: string;
}): Promise<any> {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.RESEND_API_KEY;
        const postData = JSON.stringify(payload);
        
        const options = {
            hostname: 'api.resend.com',
            port: 443,
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 300, data: parsed });
                } catch (e) {
                    resolve({ ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 300, raw: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

export async function sendPasswordResetEmailAction(input: { userEmail: string }): Promise<{ success: boolean; message: string }> {
    const sanitizedEmail = input.userEmail.trim().toLowerCase();
    try {
        let resetLink: string | null = null;
        try {
            resetLink = await auth.generatePasswordResetLink(sanitizedEmail);
        } catch (error: any) {
            // Rate limit — rethrow immediately with a friendly message
            if (error.message?.includes('RESET_PASSWORD_EXCEED_LIMIT')) {
                throw new Error('Du har anmodet om nulstilling for mange gange. Vent venligst et par minutter og prøv igen.');
            }
            const isUserNotFound = error.code === 'auth/user-not-found' || 
                                   (error.code === 'auth/internal-error' && error.message?.includes('Unable to create the email action link'));
            if (!isUserNotFound) {
                throw error;
            }
        }

        if (resetLink) {
            const htmlContent = wrapEmailHtml(`
              <h1 style="color: #451a03; font-size: 24px; margin-bottom: 20px; font-family: serif;">Nulstil din adgangskode</h1>
              <p>Hej,</p>
              <p>Du har anmodet om at nulstille din adgangskode til din Cohéro-konto.</p>
              <p>Klik på knappen nedenfor for at vælge en ny adgangskode:</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${resetLink}" style="background-color: #451a03; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Nulstil adgangskode</a>
              </div>
              <p style="font-size: 13px; color: #64748b;">Hvis du ikke har anmodet om dette, kan du roligt ignorere denne e-mail. Dit kodeord forbliver uændret.</p>
              <p style="font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 20px;">Hvis knappen ikke virker, kan du kopiere og indsætte dette link i din browser:<br/>${resetLink}</p>
            `);
            const emailResult = await sendResendEmailRaw({
                from: 'Cohéro <info@platform.cohero.dk>',
                to: sanitizedEmail,
                subject: 'Nulstil din adgangskode til Cohéro',
                html: htmlContent,
            });
            if (!emailResult.ok) {
                console.error("Resend API error:", emailResult);
                throw new Error(emailResult.data?.message || emailResult.raw || 'Kunne ikke sende e-mail via Resend.');
            }
            console.log(`Password reset email sent successfully to registered user: ${sanitizedEmail}. Result:`, JSON.stringify(emailResult));
        } else {
            // User does not exist, send a registration nudge email!
            const nudgeHtml = wrapEmailHtml(`
              <h1 style="color: #451a03; font-size: 24px; margin-bottom: 20px; font-family: serif;">Ingen bruger fundet</h1>
              <p>Hej,</p>
              <p>Du har anmodet om at nulstille din adgangskode til Cohéro på denne e-mailadresse.</p>
              <p>Vi kan dog se, at der ikke er oprettet nogen bruger med denne e-mailadresse i vores system.</p>
              <p>Hvis du ønsker at oprette en gratis konto, kan du gøre det her:</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="https://student.cohero.dk" style="background-color: #451a03; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Opret gratis konto</a>
              </div>
              <p style="font-size: 13px; color: #64748b;">Hvis du allerede har en konto hos os under en anden e-mail, kan du prøve igen med den.</p>
            `);
            const emailResult = await sendResendEmailRaw({
                from: 'Cohéro <info@platform.cohero.dk>',
                to: sanitizedEmail,
                subject: 'Ingen bruger fundet hos Cohéro',
                html: nudgeHtml,
            });
            if (!emailResult.ok) {
                console.error("Resend API error:", emailResult);
                throw new Error(emailResult.data?.message || emailResult.raw || 'Kunne ikke sende e-mail via Resend.');
            }
            console.log(`Sent registration nudge email to unregistered address: ${sanitizedEmail}. Result:`, JSON.stringify(emailResult));
        }

        return { success: true, message: 'Password reset flow processed.' };
    } catch (error: any) {
        console.error('Failed to process password reset request:', error);
        const errMessage = error.message || '';
        const errCode = error.code || error.errorInfo?.code || '';
        
        if (errMessage.includes('RESET_PASSWORD_EXCEED_LIMIT')) {
            return { success: false, message: 'Du har anmodet om nulstilling for mange gange. Vent venligst et par minutter og prøv igen.' };
        }
        if (errCode === 'auth/invalid-email') {
            return { success: false, message: 'Ugyldig e-mailadresse.' };
        }
        if (errCode === 'auth/user-not-found') {
            return { success: false, message: 'Ingen bruger fundet med denne e-mail.' };
        }
        return { success: false, message: 'Der skete en fejl. Prøv igen.' };
    }
}

export async function extractLawInfoAction(input: any) { return callFirebaseFlow('extractLawInfoFromUrlFlow', input); }
export async function getLawContentAction(input: any) { 
    // If we're missing the xmlUrl, we attempt to fetch it from Firestore first
    if (!input.xmlUrl && input.documentId) {
        try {
            const doc = await adminFirestore.collection('laws').doc(input.documentId).get();
            if (doc.exists) {
                const data = doc.data();
                input.xmlUrl = data?.xmlUrl;
                input.name = input.name === 'Henter...' ? data?.name : input.name;
                input.abbreviation = input.abbreviation === 'LOV' ? data?.abbreviation : input.abbreviation;
                input.lbk = data?.lbk;
            }
        } catch (e) {
            console.error("Failed to resolve law metadata on server:", e);
        }
    }
    
    // If we still don't have a URL, the flow will naturally fail with a Zod error,
    // but at least we tried our best to resolve it.
    return callFirebaseFlow('getLawContentFlow', input); 
}

export async function explainLawParagraphAction(input: { lawId: string, lovTitel: string, paragrafNummer: string, paragrafTekst: string }): Promise<Types.ExplainLawParagraphOutput> {
    const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: input.lawId, name: input.lovTitel });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('explainLawParagraphFlow', {
        lovTitel: input.lovTitel,
        paragrafNummer: input.paragrafNummer,
        paragrafTekst: input.paragrafTekst,
        lovtekst: lawContext
    });
}

export async function analyzeParagraphAction(input: { lovTitel: string, paragrafNummer: string, paragrafTekst: string, fuldLovtekst: string, uniqueDocumentId?: string }): Promise<Types.AnalyzeParagraphOutput> {
    let urlContext = '';
    if (input.uniqueDocumentId) {
        try {
            // Fetch related guidelines (Type 3) and decisions (Type 6) with resilient error handling
            const [guidelinesRes, decisionsRes] = await Promise.all([
                fetch(`https://www.retsinformation.dk/api/document/documentLinks/3/${input.uniqueDocumentId}`).then(r => r.ok ? r.json() : []),
                fetch(`https://www.retsinformation.dk/api/document/documentLinks/6/${input.uniqueDocumentId}`).then(r => r.ok ? r.json() : [])
            ]);

            const guidelines = (guidelinesRes || []).filter((g: any) => g.shortName?.startsWith('VEJ')).slice(0, 2);
            const decisions = (decisionsRes || []).filter((d: any) => !d.isHistoryFlag && !d.isHistorical).slice(0, 2);

            const linkItems = [...guidelines, ...decisions];
            
            // INNOVATION: Fetch and parse the actual XML content of these related documents
            const contextData = await Promise.all(linkItems.map(async (item: any) => {
                const path = item.eliPath || item.href || '';
                if (!path) return null;
                const xmlUrl = path.startsWith('http') ? (path.endsWith('/xml') ? path : `${path}/xml`) : `https://www.retsinformation.dk${path}/xml`;
                
                try {
                    const res = await fetch(xmlUrl);
                    if (!res.ok) return null;
                    const xmlText = await res.text();
                    
                    // Use our library parser to get clean text
                    const { parseRetsinformationXml, extractText } = await import('@/lib/law-engine/xml-parser');
                    const parsed = parseRetsinformationXml(xmlText, item.shortName || item.title);
                    
                    // Summarize the most relevant part (e.g. the first few chapters or anything related to the specific paragraph)
                    const fullCleanText = parsed.kapitler.map(c => `${c.nummer} ${c.titel}\n${c.paragraffer.map(p => p.tekst).join('\n')}`).join('\n\n');
                    
                    return `--- KILDE: ${item.shortName || item.title} ---\n${fullCleanText.substring(0, 3000)}... [Forkortet for viden-densitet]`;
                } catch (e) {
                    return null;
                }
            }));

            const validContexts = contextData.filter(Boolean);

            if (validContexts.length > 0) {
                urlContext = "AUTORITATIV PRAKSIS-KONTEKST (Inddrag disse specifikke vejledninger og afgørelser i din vurdering):\n\n" + validContexts.join('\n\n');
            }
        } catch (e) {
            console.error("Failed to fetch deep context links:", e);
        }
    }

    return callFirebaseFlow('analyzeParagraphFlow', { ...input, urlContext });
}

export async function recommendTechniqueAction(input: any) { return callFirebaseFlow('recommendTechniqueFlow', input); }
export async function explainTechniqueWithAnalogyAction(input: any) { return callFirebaseFlow('explainTechniqueWithAnalogyFlow', input); }
export async function generateExamBlueprintAction(input: Types.ExamArchitectInput) { return callFirebaseFlow('generateExamBlueprintFlow', input); }
export async function suggestExamTopicAction(input: Types.SuggestExamTopicInput) { return callFirebaseFlow('suggestExamTopicFlow', input); }
export async function getIntroCaseConsequenceAction(input: any) { return callFirebaseFlow('getIntroCaseConsequenceFlow', input); }
export async function getMythBusterResponseAction(input: any) { return callFirebaseFlow('getMythBusterResponseFlow', input); }
export async function getCareerMatchAction(input: any) { return callFirebaseFlow('getCareerMatchFlow', input); }
export async function reviseCaseAction(input: any) { return callFirebaseFlow('reviseCaseFlow', input); }
export async function researchDiscoveryAction(input: Types.ResearchDiscoveryInput): Promise<Types.ResearchDiscoveryOutput> {
    return callFirebaseFlow('researchDiscoveryFlow', input);
}

export async function generateNewCase(input: Types.GenerateCaseInput): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes?.data || '';
    return callFirebaseFlow('generateCaseFlow', { ...input, lawContext });
}

export const generateCaseAction = generateNewCase;


export async function generateVerificationEmailAction(input: Types.VerificationEmailInput): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateVerificationEmailFlow', input);
        
        await resend.emails.send({
            from: 'Cohéro <kontakt@cohero.dk>',
            // @ts-ignore
            to: input.userEmail, // Assuming userEmail is part of VerificationEmailInput
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: 'Verification email sent.' };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, message: 'Failed to send verification email.' };
    }
}

export async function getConsensusAnalysisAction(input: any) { return callFirebaseFlow('getConsensusAnalysisFlow', input); }
export async function getSocraticReflectionAction(input: Types.SocraticInput) { return callFirebaseFlow('getSocraticReflectionFlow', input); }

export async function explainConceptAction(input: { concept: string, profession?: string }): Promise<Types.ExplainConceptOutput> {
    return callFirebaseFlow('explainConceptFlow', { ...input });
}

export async function conceptFollowUpAction(input: {
    message: string;
    conceptName: string;
    conceptDefinition: string;
    chatHistory: { role: 'user' | 'assistant'; content: string }[];
    profession?: string;
}): Promise<{ data: { answer: string } }> {
    let lawContext = '';
    try {
        const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: `${input.message} ${input.conceptName}` });
        lawContext = fetchRes?.data || '';
    } catch (e) {
        console.error('[conceptFollowUp] Law context fetch failed:', e);
    }

    const conceptContext = `AKTUEL FAGLIG KONTEKST:\nBegreb: ${input.conceptName}\nDefinition (uddrag): ${input.conceptDefinition.replace(/<[^>]*>/g, '').substring(0, 1500)}`;

    try {
        const result = await callFirebaseFlow('unifiedChatFlow', {
            message: input.message,
            chatHistory: input.chatHistory,
            persona: 'academic',
            context: {
                relevantDocumentIds: [],
                lawContext: [conceptContext, lawContext].filter(Boolean).join('\n\n---\n\n'),
            },
        });
        // Normalise output shape
        const answer = result?.data?.answer || result?.answer || 'Jeg kunne ikke besvare spørgsmålet. Prøv igen.';
        return { data: { answer } };
    } catch (e: any) {
        console.error('[conceptFollowUp] Flow failed:', e);
        return { data: { answer: 'Der opstod en fejl. Prøv igen.' } };
    }
}

export async function explainConceptWithAnalogyAction(input: any) { return callFirebaseFlow('explainConceptWithAnalogyFlow', input); }

export async function getCaseConsequenceAction(input: any) { return callFirebaseFlow('getCaseConsequenceFlow', input); }

export async function generateQuizAction(input: { topic: string, numQuestions: number, difficulty?: 'easy' | 'medium' | 'hard', lawId?: string, contextText?: string, profession?: string }): Promise<Types.QuizGeneratorOutput> {
    let lawContext = '';
    if (input.lawId) {
        try {
            const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: input.lawId, name: input.topic });
            lawContext = fetchRes?.data || '';
        } catch (e) {
            console.error("[generateQuizAction] Law context fetch error:", e);
        }
    }

    return callFirebaseFlow('generateQuizFlow', {
        topic: input.topic,
        numQuestions: input.numQuestions,
        difficulty: input.difficulty || 'medium',
        lawContext: lawContext || undefined,
        contextText: input.contextText,
        profession: input.profession
    });
}

export async function saveQuizResultAction(params: { userId: string, result: Omit<Types.QuizResult, 'createdAt'> }): Promise<{ success: boolean }> {
    const resultRef = adminFirestore.collection('users').doc(params.userId).collection('quizResults').doc();

    try {
        await resultRef.set({
            ...params.result,
            createdAt: FieldValue.serverTimestamp()
        });

        // --- Gamification: Check for active Quiz Challenges ---
        const now = new Date();
        const activeEvents = await adminFirestore.collection('gamificationEvents')
            .where('startDate', '<=', now)
            .where('endDate', '>=', now)
            .where('isActive', '==', true)
            .where('type', '==', 'quiz_count')
            .get();

        if (!activeEvents.empty) {
            const userDoc = await adminFirestore.collection('users').doc(params.userId).get();
            const userName = userDoc.data()?.username || userDoc.data()?.displayName || 'Anonym Kollega';

            for (const eventDoc of activeEvents.docs) {
                const progressRef = adminFirestore.collection('gamificationEvents')
                    .doc(eventDoc.id)
                    .collection('userProgress')
                    .doc(params.userId);

                await progressRef.set({
                    userId: params.userId,
                    userName,
                    score: FieldValue.increment(1),
                    lastUpdate: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }
        // ---------------------------------------------------

        return { success: true };
    } catch (e) {
        console.error("Failed to save quiz result:", e);
        return { success: false };
    }
}

export async function getFagligtMyceliumAction(input: any) { return callFirebaseFlow('getFagligtMyceliumFlow', input); }
export async function analyzeReformPdfAction(input: any) { return callFirebaseFlow('analyzeReformPdfFlow', input); }
export async function searchDiagnoseAction(input: { query: string, profession?: string }) { 
    try {
        return await callFirebaseFlow('searchDiagnoseFlow', input); 
    } catch (error: any) {
        console.error("[searchDiagnoseAction] Error:", error.message);
        return { success: false, error: error.message };
    }
}
export async function seminarArchitectAction(input: SeminarArchitectInput): Promise<SeminarArchitectOutput> { return callFirebaseFlow('seminarArchitectFlow', input); }
export async function translateSeminarAction(input: TranslateSeminarInput): Promise<TranslateSeminarOutput> { return callFirebaseFlow('translateSeminarFlow', input); }
export async function chatWithSeminarAction(input: SeminarChatInput): Promise<SeminarChatOutput> { return callFirebaseFlow('seminarChatFlow', input); }
export async function generateSemesterPlanAction(input: any) { return callFirebaseFlow('generateSemesterPlanFlow', input); }
export async function suggestConceptsForEventAction(input: any) { return callFirebaseFlow('suggestConceptsForEventFlow', input); }
export async function generateStudyScheduleAction(input: any) { return callFirebaseFlow('generateStudyScheduleFlow', input); }
export async function generateCategoryStudyPlanAction(input: { topic: string, context: string }) { return callFirebaseFlow('generateCategoryStudyPlanFlow', input); }
export async function explainFolketingetSagAction(input: { caseTitle: string, caseResume?: string, sagId?: number }) { 
    let deepContext = "";
    
    if (input.sagId) {
        try {
            console.log(`[AI-DEEP] Fetching documents for sagId: ${input.sagId}...`);
            const docs = await fetchSagDokumenter(input.sagId);
            
            // Look for the most representative document (type 13 is often "Lovforslag som fremsat")
            const targetDoc = docs.find(d => d.Dokument?.Fil?.some(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf')));
            
            if (targetDoc) {
                const pdf = targetDoc.Dokument.Fil.find(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf'));
                const { base64 } = await fetchFolketingetPdfAction(pdf.filurl);
                const text = await extractTextFromPdf(Buffer.from(base64, 'base64'));
                deepContext = `DOKUMENT-KONTEKST (Udtræk fra officielt PDF-dokument):\n\n${text.substring(0, 15000)}`;
            }
        } catch (e) {
            console.error("[AI-DEEP] Failed to extract deep context:", e);
        }
    }

    return callFirebaseFlow('explainFolketingetSagFlow', { ...input, deepContext }); 
}

export async function startFolketingetCaseChatAction(input: { sagId: number, message: string, chatHistory: any[] }) {
    try {
        console.log(`[CHAT-STRICT] >>> STARTING CHAT SESSION FOR SAG ID: ${input.sagId}`);
        const docs = await fetchSagDokumenter(input.sagId);
        
        // Prepare a list of document references (Titles + Links)
        const docReferences = docs.map(d => {
            const pdf = d.Dokument?.Fil?.find(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf'));
            return {
                titel: d.Dokument?.titel || 'Ukendt titel',
                url: pdf?.filurl || 'Ingen PDF tilgængelig'
            };
        });

        const pdfDocs = docs.filter(d => d.Dokument?.Fil?.some(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf')));
        console.log(`[CHAT-STRICT] Identified ${pdfDocs.length} PDF documents for extraction.`);
        
        // Fetch and extract text from up to 3 major documents
        const textParts = await Promise.all(pdfDocs.slice(0, 3).map(async (d, idx) => {
            try {
                const pdf = d.Dokument.Fil.find(f => f.format === 'PDF' || f.filurl.toLowerCase().endsWith('.pdf'));
                
                console.log(`[CHAT-STRICT] Fetching Doc ${idx + 1}: ${pdf.filurl}`);
                const result = await fetchFolketingetPdfAction(pdf.filurl);
                
                if (result.error) {
                    console.warn(`[CHAT-STRICT] Skipping Doc ${idx + 1} due to error: ${result.error}`);
                    return `DOKUMENT: ${d.Dokument.titel}\nFEJL: Kunne ikke læse filen automatisk (Bot-protection). Brugeren skal selv tjekke linket: ${pdf.filurl}`;
                }

                const text = await extractTextFromPdf(Buffer.from(result.base64, 'base64'));
                console.log(`[CHAT-STRICT] Extracted ${text.length} chars from Doc ${idx + 1}`);
                return `DOKUMENT: ${d.Dokument.titel}\nURL: ${pdf.filurl}\n---\n${text.substring(0, 15000)}`;
            } catch (e) {
                console.error(`[CHAT-STRICT] Failed to extract Doc ${idx + 1}:`, e);
                return "";
            }
        }));

        const aggregatedContext = textParts.filter(Boolean).join('\n\n####################\n\n');
        const linksContext = docReferences.map(r => `- ${r.titel}: ${r.url}`).join('\n');

        return callFirebaseFlow('unifiedChatFlow', {
            message: input.message,
            chatHistory: input.chatHistory,
            persona: 'academic',
            context: {
                relevantDocumentIds: [],
                lawContext: `KILDEKRITISK INSTRUKS: 
                Du er en juridisk assistent der hjælper en socialrådgiver med at analysere Folketingets sag ID ${input.sagId}. 
                
                VIGTIG STATUS: 
                Folketingets servere blokerer i øjeblikket for direkte automatisk læsning af visse PDF-filer. 
                Hvis du ser "FEJL: Kunne ikke læse filen", skal du informere brugeren om dette og i stedet basere dit svar på:
                1. Sagens officielle resume og titel.
                2. De links der er vedlagt nedenfor (guide brugeren til selv at læse dem).
                3. Din generelle viden om dansk lovgivningsproces, HVIS det er relevant for at forklare sagens gang.
                
                REGLER:
                1. Vær ærlig om hvad du kan læse og hvad du ikke kan.
                2. Henvis altid til de specifikke dokument-links nedenfor.
                
                DOKUMENT-LISTE (REFERENCER):
                ${linksContext}
                
                DOKUMENT-DATA (INDHOLD):
                ${aggregatedContext || 'Ingen læsbar dokumenttekst fundet grundet tekniske begrænsninger hos ft.dk.'}`
            }
        });
    } catch (error) {
        console.error("[CHAT-STRICT] Critical failure in chat action:", error);
        throw error;
    }
}

export async function getFTSagMetadataAction(input: { sagId: number, title: string, resume?: string }) {
    try {
        const docRef = adminFirestore.collection('ftCaseMetadata').doc(input.sagId.toString());
        const snap = await docRef.get();
        
        if (snap.exists) {
            return { data: JSON.parse(JSON.stringify(snap.data())), usage: { inputTokens: 0, outputTokens: 0 } };
        }
        
        // If it doesn't exist, try to generate it
        const result = await callFirebaseFlow('generateFTSagMetadataFlow', { 
            caseTitle: input.title, 
            caseResume: input.resume 
        });
        
        if (result && result.data) {
            await docRef.set({
                ...result.data,
                lastGenerated: FieldValue.serverTimestamp()
            });
        }
        
        return result;
    } catch (error) {
        console.error("Failed to get/generate FT sag metadata:", error);
        // Return null data instead of throwing to prevent 500 errors in the UI
        return { data: null, error: true };
    }
}



export async function analyzeScientificParadigmAction(input: Types.AnalyzeScientificParadigmInput): Promise<Types.AnalyzeScientificParadigmOutput> {
    return callFirebaseFlow('analyzeScientificParadigmFlow', input);
}

// SIMULATION ACTIONS
export async function runSimulationTurnAction(input: Types.SimulationTurnInput): Promise<Types.SimulationTurnOutput> {
    return callFirebaseFlow('runSimulationTurnFlow', input);
}

export async function generateSimulationReportAction(input: { citizen: Types.SimulationCitizen, chatHistory: { role: 'user' | 'assistant', content: string }[], profession?: string }): Promise<Types.SimulationReport> {
    return callFirebaseFlow('generateSimulationReportFlow', input);
}

export async function generateSimulationScenarioAction(input: { topic: string, profession?: string }): Promise<{ data: Types.SimulationCitizen }> {
    return callFirebaseFlow('generateSimulationScenarioFlow', input);
}

export async function oralExamAnalysisAction(input: Types.OralExamAnalysisInput): Promise<Types.OralExamAnalysisOutput> {
    return callFirebaseFlow('oralExamAnalysisFlow', input);
}
export async function unifiedChatAction(input: Types.UnifiedChatInput): Promise<Types.UnifiedChatOutput> { 
    return callFirebaseFlow('unifiedChatFlow', input); 
}

export async function materialVectorChatAction(input: { userId: string, message: string, materialId?: string, chatHistory?: any[] }): Promise<{ answer: string }> {
    return callFirebaseFlow('materialVectorChatFlow', input);
}

export async function indexMaterialAction(input: { userId: string, materialId: string, rawText: string }) {
    return callFirebaseFlow('indexMaterialFlow', input);
}

export async function migrateMaterialsAction(input: { userId: string, force?: boolean }) {
    return callFirebaseFlow('migrateMaterialsFlow', input);
}


/**
 * identifyReformAction
 * Step 1: Identifies the documents for a reform.
 */
export async function identifyReformAction(input: string | { query: string }): Promise<Types.IdentifyReformOutput> {
    const query = typeof input === 'string' ? input : input.query;
    return callFirebaseFlow('identifyReformFlow', { query });
}

/**
 * generateParagraphDiffAction / generateReformAnalysisAction
 * Step 2: Generates the detailed diff between a bill and a law.
 * Includes caching in Firestore.
 */
export async function generateParagraphDiffAction(billOrParams: Types.ReformCandidate | { targetLawTitle: string; newBillXmlUrl: string; oldLawXmlUrl: string }, law?: Types.ReformCandidate, query?: string): Promise<Types.GenerateParagraphDiffOutput> {
    // Check if called with discrete params (lov-portal usage) or objects (VidenChat usage / Legacy)
    let targetLawTitle: string;
    let oldLawXmlUrl: string;
    let newBillXmlUrl: string;
    let cacheKey: string | null = null;

    if ('targetLawTitle' in billOrParams) {
        targetLawTitle = billOrParams.targetLawTitle;
        oldLawXmlUrl = billOrParams.oldLawXmlUrl;
        newBillXmlUrl = billOrParams.newBillXmlUrl;
        cacheKey = `diff_${targetLawTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}_${newBillXmlUrl.split('/').pop()}`;
    } else if (law && query) {
        targetLawTitle = law.title;
        oldLawXmlUrl = law.xmlUrl;
        newBillXmlUrl = billOrParams.xmlUrl;
        cacheKey = `analysis_${query.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
    } else {
        throw new Error("Invalid arguments to generateParagraphDiffAction");
    }
    
    // Check cache
    const { adminFirestore } = await import('@/firebase/server-init');
    const cacheDoc = await adminFirestore.collection('reformAnalyses').doc(cacheKey).get();
    
    if (cacheDoc.exists) {
        return { data: JSON.parse(JSON.stringify(cacheDoc.data())) as Types.GenerateParagraphDiffData, usage: { inputTokens: 0, outputTokens: 0 } };
    }

    const result = await callFirebaseFlow('generateParagraphDiffFlow', {
        targetLawTitle,
        oldLawXmlUrl,
        newBillXmlUrl,
    });

    // Save to cache
    await adminFirestore.collection('reformAnalyses').doc(cacheKey).set({
        ...result.data,
        cachedAt: new Date().toISOString(),
    });

    return result;
}

// Keep legacy name for internal compatibility if needed
export const generateReformAnalysisAction = generateParagraphDiffAction;


export async function simulateStartAction(input: { theme: string, userName: string, currentDateStr: string, profession?: string }): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.theme });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('simulateStartFlowFlow', { theme: input.theme, lawContext, userName: input.userName, currentDateStr: input.currentDateStr, profession: input.profession });
}

export async function simulateNextDayAction(input: { cases: any[], previousInbox: any[], userJournals: Record<string, string>, currentDay: number, daysPassed: number, userName: string, newDateStr: string, profession?: string }): Promise<any> {
    return callFirebaseFlow('simulateNextDayFlowFlow', input);
}

export async function simulateFeedbackAction(input: { cases: any[], inbox: any[], userJournals: Record<string, string>, totalDays: number, userName: string, profession?: string }): Promise<any> {
    return callFirebaseFlow('simulateFeedbackFlowFlow', input);
}

export async function analyzeFtDocumentAction(input: any) { return callFirebaseFlow('analyzeFtDocumentFlow', input); }
export async function analyzeCasePdfAction(input: AnalyzeCasePdfInput): Promise<AnalyzeCasePdfOutput> { 
    return callFirebaseFlow('analyzeCasePdfFlow', input); 
}

export async function analyzeSyllabusAction(input: { 
    userId: string, 
    materialId: string, 
    fileUrl: string, 
    fileName: string, 
    learningGoals: string[], 
    profession?: string 
}) {
    try {
        console.log(`[analyzeSyllabusAction] Starting indexing for: ${input.fileName}`);
        
        // 0. Update status to processing immediately
        await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .set({
                isIndexed: 'processing'
            }, { merge: true });

        const startTime = Date.now();
        
        // 1. Fetch file with timeout
        console.log(`[analyzeSyllabusAction] Fetching file from URL...`);
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 20000); // 20s fetch timeout
        
        const response = await fetch(input.fileUrl, { signal: controller.signal });
        clearTimeout(fetchTimeout);
        
        if (!response.ok) throw new Error(`Kunne ikke hente fil: ${response.statusText}`);
        
        console.log(`[analyzeSyllabusAction] Converting to buffer...`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`[analyzeSyllabusAction] Buffer ready (${(buffer.length / 1024 / 1024).toFixed(2)} MB). Starting extraction...`);
        
        const rawText = await extractTextFromPdf(buffer);
        console.log(`[analyzeSyllabusAction] Extraction finished in ${Date.now() - startTime}ms. Saving to Firestore...`);
        
        // 2. Save raw text and mark as indexed
        await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .set({
                rawText,
                isIndexed: true,
                contentIndexedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

        console.log(`[analyzeSyllabusAction] Successfully indexed ${rawText.length} characters.`);

        return { success: true, indexed: true };
    } catch (error) {
        console.error('[analyzeSyllabusAction] Indexing failed:', error);
        throw error;
    }
}
export async function fetchVivePublicationsAction(input: any) { return callFirebaseFlow('fetchVivePublicationsFlow', input); }
export async function textToSpeechAction(input: any) { return callFirebaseFlow('textToSpeechFlow', input); }
export async function getViveReportQaAction(input: any) { return callFirebaseFlow('getViveReportQaFlow', input); }
export async function generateReportQuestionsAction(input: any) { return callFirebaseFlow('generateReportQuestionsFlow', input); }
export async function generateModuleExamPrepAction(input: Types.ModuleExamPrepInput): Promise<Types.ModuleExamPrepOutput> {
    return callFirebaseFlow('generateModuleExamPrepFlow', input);
}
export async function analyzeStarDataAction(input: Types.AnalyzeStarDataInput): Promise<Types.AnalyzeStarDataOutput> {
    return callFirebaseFlow('analyzeStarDataFlow', input);
}

import fsSync from 'fs';

function logToConsole(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[ACTION-DEBUG][${timestamp}] ${message}`);
}

export async function saveMaterialTextAction(input: { 
    userId: string, 
    materialId: string, 
    rawText: string 
}) {
    try {
        logToConsole(`Starting saveMaterialTextAction for ${input.materialId}`);
        console.log(`[saveMaterialTextAction] Saving ${input.rawText.length} characters for material ${input.materialId}`);
        
        // 1. Gem rå-teksten i Firestore (for backup/legacy search)
        await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .set({
                rawText: input.rawText,
                isIndexed: 'generating', // status mens vi bygger embeddings
            }, { merge: true });

        // 2. Kald Firebase Function for at generere embeddings asynkront
        // (Vi venter ikke nødvendigvis på denne i backend, men her gør vi for sikkerhedens skyld)
        try {
            await callFirebaseFlow('indexMaterialFlow', {
                userId: input.userId,
                materialId: input.materialId,
                rawText: input.rawText
            });
            logToConsole(`Vector indeksering fuldført for ${input.materialId}.`);
        } catch (e) {
            console.error("Vector indexering fejlede:", e);
            // Revert status
            await adminFirestore.collection('users').doc(input.userId).collection('materials').doc(input.materialId).set({
                isIndexed: true, // fallback til normal
                vectorIndexed: false
            }, { merge: true });
        }

        return { success: true };
    } catch (error) {
        logToConsole(`saveMaterialTextAction Error: ${error}`);
        console.error('[saveMaterialTextAction] Failed to save text:', error);
        throw error;
    }
}

export async function generateMaterialAIOverviewAction(input: {
    userId: string,
    materialId: string,
    rawText: string,
    candidateLearningGoals?: string[]
}) {
    try {
        logToConsole(`Starting generateMaterialAIOverviewAction for ${input.materialId}`);
        
        await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .update({
                isIndexed: 'generating'
            });

        const geminiKey = getGeminiApiKey();

        const textToSummarize = input.rawText.substring(0, 30000);
        const learningGoalsContext = input.candidateLearningGoals && input.candidateLearningGoals.length > 0
            ? `\nHER ER DE OFFICIELLE LÆRINGSMÅL DU SKAL VÆLGE FRA:\n${input.candidateLearningGoals.map(g => `- ${g}`).join('\n')}\nVælg kun de læringsmål fra denne liste som materialet rent faktisk dækker.`
            : `\nIdentificer relevante læringsmål eller kompetencer som dette materiale dækker.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Du er en ekspert i at analysere studiemateriale og skabe guidede studieforløb. 
Din opgave er at analysere den vedhæftede tekst og identificere de vigtigste afsnit, der er direkte relevante for de officielle læringsmål.

Du SKAL returnere et JSON objekt med denne struktur:
{
  "summary": "En meget kort og præcis opsummering (max 2-3 sætninger)",
  "complexity": "begynder | øvet | ekspert",
  "isIntroductory": true,
  "keyPoints": [
    { "title": "Overskrift på pointe", "description": "Uddybning" }
  ],
  "learningGoals": [
    { 
      "goal": "Vælg det præcise navn på læringsmålet fra listen", 
      "explanation": "Hvorfor er dette dokument vigtigt for netop dette mål?",
      "steps": [
        { 
          "title": "Fokusområde (f.eks. 'Introduktion til kildekritik')", 
          "description": "Forklar hvad den studerende skal lære i dette specifikke afsnit.", 
          "context": "Indsæt et REELT citat fra teksten eller en meget specifik beskrivelse af afsnittet, som man kan genkende med det samme.", 
          "pageNumber": 1 
        }
      ]
    }
  ],
  "entities": [
    {
      "name": "Navn på begreb, teori eller person",
      "type": "concept | theory | person | organization",
      "description": "Kort forklaring af hvad det er",
      "relatedGoals": ["Navn på læringsmål det understøtter"],
      "pageNumber": 1
    }
  ]
}

REGLER FOR STEPS:
1. Find mindst 2 trin (steps) for hvert relevant læringsmål (MAX 3 TRIN TOTAL pr. mål).
2. 'context' SKAL indeholde tekst direkte fra dokumentet. 
3. VIGTIGT: Brug ALDRIG faktiske linjeskift inde i JSON-strenge.
4. VIGTIGT: Brug ALDRIG dobbelte anførselstegn (") inde i en tekst. Brug enkelte anførselstegn (') i stedet for. Eksempel: 'Dette er et citat'.
5. 'pageNumber' SKAL være det rigtige sidetal i PDF'en.

${learningGoalsContext}

Sørg for at svaret KUN indeholder JSON objektet. Teksten:\n\n${textToSummarize}`
                    }]
                }],
                generationConfig: { 
                    temperature: 0.1, 
                    maxOutputTokens: 8192,
                    response_mime_type: "application/json"
                }
            }),
            signal: controller.signal // Added signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const aiData = await response.json();
            let overviewJson = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (overviewJson) {
                try {
                    const overviewData = repairJson(overviewJson);
                    const overviewDataStr = JSON.stringify(overviewData);
                    logToConsole(`[generateAction] Valid JSON received (or healed) for ${input.materialId}`);
                    
                    await adminFirestore.collection("users")
                        .doc(input.userId)
                        .collection("materials")
                        .doc(input.materialId)
                        .update({
                            aiOverviewData: overviewDataStr,
                            overviewGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                            isIndexed: true 
                        });
                    return { success: true, overview: overviewDataStr };
                } catch (pErr) {
                    logToConsole(`[generateAction] JSON Parse Error: ${pErr}`);
                    console.error("[generateAction] Failed JSON content:", overviewJson?.substring(0, 500));
                    throw new Error(`AI svarede med ugyldigt format: ${pErr}`);
                }
            } else {
                throw new Error("AI svarede uden indhold.");
            }
        } else {
            const errorBody = await response.text();
            console.error("[generateAction] Gemini API Error:", errorBody);
            throw new Error(`AI Tjeneste Fejl: ${response.status}`);
        }
        throw new Error("Kunne ikke generere overblik.");
    } catch (err) {
        logToConsole(`generateMaterialAIOverviewAction Error: ${err}`);
        // Reset status to true so they can try again
        await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .doc(input.materialId)
            .update({ isIndexed: true });
        throw err;
    }
}

export async function generateMaterialMindmapAction(input: {
    userId: string,
    materialId?: string, // If missing, use all materials for the semester
    semesterId: string,
    rawText?: string, // If provided, use this. Otherwise fetch from Firestore.
    focus?: string // Optional special focus
}) {
    const { adminFirestore } = await import('@/firebase/server-init');
    try {
        const geminiKey = getGeminiApiKey();

        let textToAnalyze = input.rawText || "";

        if (!textToAnalyze && input.userId && input.semesterId) {
            if (input.materialId) {
                // Fetch chunks for specific material
                const chunksSnapshot = await adminFirestore.collection('users')
                    .doc(input.userId)
                    .collection('materialChunks')
                    .where('materialId', '==', input.materialId)
                    .orderBy('chunkIndex', 'asc')
                    .get();
                
                textToAnalyze = chunksSnapshot.docs
                    .map(doc => doc.data().text || "")
                    .join('\n');
            } else {
                // Fetch materials for this semester to get their IDs
                const materialsSnapshot = await adminFirestore.collection('users')
                    .doc(input.userId)
                    .collection('materials')
                    .where('semester', '==', input.semesterId)
                    .get();
                
                const materialIds = materialsSnapshot.docs.map(doc => doc.id);
                
                if (materialIds.length > 0) {
                    console.log(`[Mindmap] Fetching balanced chunks for ${materialIds.length} materials`);
                    
                    // Dynamically decide how many chunks to take from each to fit within our limit
                    // Aiming for a total of ~60-80 chunks across all materials
                    const chunksPerMaterial = Math.max(2, Math.floor(80 / materialIds.length));
                    
                    const materialPromises = materialIds.map(id => 
                        adminFirestore.collection('users')
                            .doc(input.userId)
                            .collection('materialChunks')
                            .where('materialId', '==', id)
                            .limit(chunksPerMaterial)
                            .get()
                    );
                    
                    const snapshots = await Promise.all(materialPromises);
                    let allChunks: any[] = [];
                    snapshots.forEach(snap => {
                        allChunks.push(...snap.docs.map(doc => doc.data()));
                    });
                    
                    console.log(`[Mindmap] Total balanced chunks collected: ${allChunks.length}`);
                    
                    textToAnalyze = allChunks
                        .map(c => c.text || "")
                        .join('\n')
                        .substring(0, 80000); // Slightly higher for more breadth
                    
                    console.log(`[Mindmap] Final balanced text length: ${textToAnalyze.length}`);
                }
            }
        }

        const prompt = `${input.focus ? `DU SKAL ANALYSERE TEKSTEN MED ET EKSTREMT STÆRKT OG EKSKLUSIVT FOKUS PÅ: "${input.focus}". 
Alt i dit mindmap SKAL være direkte relateret til "${input.focus}". Du må IKKE inkludere andre teoretikere eller begreber fra teksten, medmindre de bruges til at forklare eller perspektivere "${input.focus}". 
Hvis teksten handler om andre emner (f.eks. andre forskere), skal du ignorere dem og kun udtrække det, der vedrører "${input.focus}".` : 'Identificer det absolutte hovedtema i teksten som din "root" node.'}

Du er en højt kvalificeret akademisk analytiker og pædagogisk arkitekt. 
Din opgave er at gennemføre en dybdegående analyse af det vedhæftede pensum-materiale og skabe et struktureret, hierarkisk mindmap.

FORMÅL:
At identificere de mest centrale elementer, begreber, metoder og teorier, så den studerende får et knivskarpt overblik til eksamen.

DU SKAL IDENTIFICERE OG ORGANISERE FØLGENDE KATEGORIER:
1. **Centrale Begreber**: Kernebegreber og definitioner der er fundamentale for emnet.
2. **Metoder & Værktøjer**: Specifikke fremgangsmåder, analysemodeller eller praktiske metoder beskrevet i teksten.
3. **Teorier & Modeller**: De teoretiske rammeværk eller videnskabelige modeller der understøtter emnet.
4. **Væsentlig Praksis/Regler**: Hvordan viden anvendes i praksis (f.eks. lovgivning, cases eller kliniske retningslinjer).
5. **Tværgående Sammenhænge**: Hvordan elementer fra forskellige kategorier relaterer sig til hinanden.

DU SKAL RETURNERE ET JSON OBJEKT MED DENNE STRUKTUR:
{
  "root": {
    "id": "root",
    "text": "Overordnet Emne",
    "children": [
      {
        "id": "theme_1",
        "text": "Tema Navn (f.eks. Centrale Begreber / Metoder / Teorier)",
        "color": "indigo | emerald | rose | amber | sky",
        "children": [
          {
            "id": "sub_1",
            "text": "Navn på elementet (f.eks. 'Strafudmåling' eller 'PARETO-modellen')",
            "description": "En præcis, akademisk forklaring på 1-2 sætninger, der opsummerer essensen.",
            "type": "concept | method | theory | law | case",
            "children": []
          }
        ]
      }
    ]
  },
  "connections": [
    { "from": "id_a", "to": "id_b", "label": "Beskriv sammenhængen kort (f.eks. 'Anvendes til at analysere...')" }
  ]
}

REGLER:
1. **Unikke ID'er**: Giv alle noder et unikt, beskrivende ID (f.eks. 'begreb_retskraft').
2. **Kategorisering (VIGTIGT)**: Du SKAL inkludere mindst 4-5 hovedgrene (f.eks. Begreber, Teorier, Metoder, Praksis). Skab et BREDT mindmap.
3. **Dybde & Koncision**: Maks 4-5 underpunkter pr. gren. Beskrivelserne SKAL være ekstremt korte (maks 15 ord). Dette er vigtigt for at nå at dække alle kategorier.
4. **Connections**: Identificer 5-10 meningsfulde forbindelser på tværs af forskellige grene.
5. **Sprog**: Al tekst skal være på dansk og i en akademisk, men letforståelig tone.
6. **Output**: Returner KUN JSON-objektet. Intet andet tekst.
7. **Kildetrohed (ULTRA VIGTIGT)**: Du må KUN bruge information fra de vedhæftede materialer. Du må UNDER INGEN OMSTÆNDIGHEDER bruge din generelle viden eller eksterne kilder. Hvis noget ikke står i teksten, må det ikke komme med i dit mindmap.

Teksten der skal analyseres:\n\n${textToAnalyze}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // Increased to 90 seconds for deep analysis

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.1, // Lower temperature for more consistent structural analysis
                    maxOutputTokens: 8192,
                    response_mime_type: "application/json"
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const aiData = await response.json();
            const result = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result) throw new Error("AI returnerede et tomt svar.");
            
            try {
                const mindmapJson = repairJson(result);
                console.log(`[generateMindmap] Successfully parsed mindmap for user ${input.userId}. Branches: ${mindmapJson.root?.children?.length || 0}`);
                return { success: true, mindmap: mindmapJson };
            } catch (parseErr) {
                console.error("[generateMindmap] JSON Parse Error after repair:", parseErr);
                console.log("[generateMindmap] Raw AI result (truncated/malformed):", result);
                throw new Error("Kunne ikke læse AI-svaret (ugyldigt format). Prøv igen.");
            }
        } else {
            const errorBody = await response.text();
            console.error("[generateMindmap] Gemini API Error:", errorBody);
            throw new Error(`AI Tjeneste Fejl: ${response.status}`);
        }
    } catch (err: any) {
        console.error("generateMaterialMindmapAction Error:", err);
        return { success: false, error: err.message };
    }
}

export async function semanticLawSearchAction(query: string, lawId?: string, documentData?: any): Promise<any> {
    try {
        let context = '';
        const lowerQuery = query.toLowerCase().trim();
        console.log(`[SemanticSearch] starting search for query: "${query}", lawId: ${lawId}`);

        if (lawId && lawId !== 'reference') {
            console.log(`[SemanticSearch] fetching law doc for ${lawId}`);
            try {
                const snapshot = await adminFirestore.collection('laws').doc(lawId).get();
                if (snapshot.exists) {
                    console.log(`[SemanticSearch] law doc exists, calling getSpecificLawContextFlow`);
                    const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: lawId, ...snapshot.data() } as any);
                    context = fetchRes.data;
                }
            } catch (error) {
                console.error("[SemanticSearch] Local law fetch failed:", error);
            }
        } else if (lawId === 'reference' && documentData) {
            context = `[REFERENCE-DOKUMENT: ${documentData.titel}]\n${documentData.rawText}\n\n`;
        }

        // IMPROVED CONTEXT FINDING (Local Logic)
        if (!context) {
            console.log(`[SemanticSearch] building local context for global search`);
            try {
                const snapshot = await adminFirestore.collection('laws').get();
                const allLaws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                
                let detectedIds: string[] = [];

                // 1. Keyword Extraction (Filter stop words)
                const stopWords = ['når', 'en', 'et', 'den', 'det', 'de', 'der', 'om', 'på', 'i', 'til', 'fra', 'ved', 'og', 'eller', 'skal', 'kan', 'er', 'var', 'bliver', 'med', 'hvis', 'efter', 'hvilke', 'hvem', 'hvor', 'hvorfor', 'hvordan'];
                const queryKeywords = lowerQuery.split(/[ \.\?\!,;]+/).filter(w => w.length > 3 && !stopWords.includes(w));

                // 2. SEARCH ALL LAWS FOR MATCHES
                const coreLawKeywords = ['kommune', 'underretning', 'mistrivsel', 'barn', 'familie', 'støtte', 'hjælp', 'afgørelse', 'forvaltning', 'sagsbehandler', 'socialforvaltning'];
                const isCaseScenario = coreLawKeywords.some(kw => lowerQuery.includes(kw));

                allLaws.forEach(l => {
                    const nameLower = (l.name || '').toLowerCase();
                    const abbrLower = (l.abbreviation || '').toLowerCase();
                    
                    // Match by abbreviations found in query
                    if (abbrLower && lowerQuery.includes(abbrLower)) detectedIds.push(l.id);
                    
                    // Match by keywords from query found in law name
                    if (queryKeywords.some(kw => nameLower.includes(kw))) detectedIds.push(l.id);
                });

                if (isCaseScenario) {
                    // Identify core laws by name if they weren't found by keywords
                    const caseTargets = ['barnets lov', 'servicelov', 'forvaltningslov', 'retssikkerhed'];
                    allLaws.forEach(l => {
                        const nameLower = (l.name || '').toLowerCase();
                        if (caseTargets.some(t => nameLower.includes(t)) && !detectedIds.includes(l.id)) {
                            detectedIds.push(l.id);
                        }
                    });
                }

                // Limit context fetching to avoid token limits
                const targetLaws = allLaws.filter(l => detectedIds.includes(l.id)).slice(0, 5);
                
                if (targetLaws.length > 0) {
                    console.log(`[SemanticSearch] fetching context for: ${targetLaws.map(l => l.abbreviation || l.id).join(', ')}`);
                    const contexts = await Promise.all(targetLaws.map(async (l) => {
                        const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { ...l });
                        return fetchRes?.data || '';
                    }));
                    context = contexts.filter(Boolean).join('\n\n---\n\n');
                }

                // If still no context, call the legacy flow as absolute fallback
                if (!context) {
                    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: query });
                    context = fetchRes.data;
                }
            } catch (err) {
                console.error("[SemanticSearch] Local context logic failed:", err);
            }
        }
        
        console.log(`[SemanticSearch] calling semanticLawSearchFlow with context length: ${context?.length || 0}`);
        const result = await callFirebaseFlow('semanticLawSearchFlow', { 
            query, 
            legalContext: context || '' 
        });
        return result;
    } catch (error: any) {
        console.error("CRITICAL ERROR in semanticLawSearchAction:", error.message);
        return { data: null, error: true, message: "Der skete en teknisk fejl under AI-søgningen." };
    }
}

export async function chatWithKnowledgeAction(input: { question: string, chatHistory: any[] }) {
    try {
        // Use the centralized law context helper via a flow
        const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.question });
        const lawContext = fetchRes?.data || '';

        return callFirebaseFlow('unifiedChatFlow', { 
            message: input.question,
            chatHistory: input.chatHistory,
            persona: 'legal',
            context: {
                relevantDocumentIds: [],
                lawContext: lawContext
            }
        });
    } catch (e: any) {
        console.error("Knowledge Chat failed:", e);
        return { data: { answer: "Der opstod en fejl i chat-forbindelsen. Prøv venligst igen." }, error: true };
    }
}

export async function generateCaseUpdateEmailAction(input: Types.CaseUpdateEmailInput): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateCaseUpdateEmailFlow', input);
        
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: "Update email sent." };
    } catch (error) {
        console.error('Failed to send case update email:', error);
        return { success: false, message: "Failed to update email." };
    }
}


export async function sendStreakReminderEmailAction(input: { userEmail: string, userName: string, streakCount: number, userId: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateStreakReminderEmailFlow', { ...input });
        
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });

        // Add in-app notification
        await sendInAppNotificationAction({
            uid: input.userId,
            title: "Hold din streak i live! 🔥",
            body: `Du har en streak på ${input.streakCount} dage. Log ind i dag for at holde den kørende!`,
            type: 'warning',
            link: '/portal'
        });

        return { success: true, message: "Streak reminder sent." };
    } catch (error) {
        console.error('Failed to send streak reminder:', error);
        return { success: false, message: "Failed to send streak reminder." };
    }
}

export async function sendGroupInvitationEmailAction(input: { recipientEmail: string, inviteeName: string, inviterName: string, groupName: string, groupUrl: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateGroupInvitationEmailFlow', {
            inviteeName: input.inviteeName,
            inviterName: input.inviterName,
            groupName: input.groupName,
            groupUrl: input.groupUrl
        });
        
        await resend.emails.send({
            from: 'Cohéro Studiegrupper <info@platform.cohero.dk>',
            to: input.recipientEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: "Invitation sent." };
    } catch (error) {
        console.error('Failed to send group invitation email:', error);
        return { success: false, message: "Failed to send invitation." };
    }
}

export async function sendBulkEmailAction(input: { recipients: { email: string, name: string }[], subject: string, htmlBody: string }): Promise<{ success: boolean; message: string; sentCount: number }> {
    const { recipients, subject, htmlBody } = input;

    if (!recipients || recipients.length === 0) {
        return { success: false, message: 'Ingen modtagere angivet.', sentCount: 0 };
    }

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Filter out invalid emails
    const validRecipients = recipients.filter(r => {
        if (!r.email) return false;
        const isValid = emailRegex.test(r.email.trim());
        if (!isValid) {
            console.warn(`Springe over ugyldig e-mail: ${r.email}`);
        }
        return isValid;
    });

    if (validRecipients.length === 0) {
        return { success: false, message: 'Ingen gyldige modtagere fundet efter validering.', sentCount: 0 };
    }

    try {
        
        let totalSentCount = 0;

        // Resend batch has a limit of 100 emails per request
        const CHUNK_SIZE = 100;
        for (let i = 0; i < validRecipients.length; i += CHUNK_SIZE) {
            const chunk = validRecipients.slice(i, i + CHUNK_SIZE);

            const { data, error } = await resend.batch.send(
                chunk.map(recipient => ({
                    from: 'Cohéro Platform <info@platform.cohero.dk>',
                    to: recipient.email.trim(),
                    subject: subject,
                    html: htmlBody.replace(/\[Navn\]/gi, recipient.name).replace(/\{\{navn\}\}/gi, recipient.name),
                }))
            );

            if (error) {
                console.error(`Resend batch error for chunk ${i}:`, error);
                return { success: false, message: `Resend Fejl: ${error.message} (${error.name})`, sentCount: totalSentCount };
            }

            totalSentCount += chunk.length;
        }

        if (totalSentCount === 0 && validRecipients.length > 0) {
            return { success: false, message: 'Ingen e-mails kunne sendes. Der opstod en fejl ved alle forsøg hos Resend.', sentCount: 0 };
        }

        return { success: true, message: `E-mails sendt (${totalSentCount} af ${recipients.length}).`, sentCount: totalSentCount };

    } catch (error: any) {
        console.error('Failed to send bulk email:', error);
        return { success: false, message: error.message || 'Ukendt fejl ved afsendelse.', sentCount: 0 };
    }
}

export async function processStudyRegulationAction(input: any) { 
    try {
        const result = await callFirebaseFlow('processStudyRegulationFlow', input); 
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Study Regulation Action Error:", e);
        return { success: false, message: e.message || "Fejl ved behandling af studieordning." };
    }
}

export async function listInternalDocsAction(): Promise<string[]> {
    const docsDir = path.join(process.cwd(), 'docs');
    try {
        // Robust check for directory existence before trying to read it
        try {
            await fs.access(docsDir);
        } catch (accessError) {
            console.warn(`Internal docs directory not found at: ${docsDir}`);
            return [];
        }
        
        const files = await fs.readdir(docsDir);
        return files.filter(f => f.endsWith('.txt') || f.endsWith('.pdf'));
    } catch (e) {
        console.error("Critical failure listing docs:", e);
        return [];
    }
}

export async function processInternalDocAction(fileName: string): Promise<any> {
    const filePath = path.join(process.cwd(), 'docs', fileName);
    try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) throw new Error("Ikke en fil.");

        const content = await fs.readFile(filePath);
        const base64 = content.toString('base64');

        // For .txt files, we use the text content directly
        // For .pdf files, we'd normally use a PDF parser, but for this prototype 
        // we'll assume the txt content is the primary source if it's not a PDF.
        const pdfText = fileName.endsWith('.txt') ? content.toString('utf-8') : 'PDF content...';

        return callFirebaseFlow('processStudyRegulationFlow', {
            pdfBase64: base64,
            pdfText: pdfText,
            institution: 'Indlæst fra Arkiv'
        });
    } catch (e) {
        console.error("Failed to process internal doc:", e);
        throw e;
    }
}

export async function extractTasksFromTextAction(input: any) { return callFirebaseFlow('extractTasksFromTextFlow', input); }
export async function analyzeTaskScheduleAction(input: any) { return callFirebaseFlow('analyzeTaskScheduleFlow', input); }
export async function extractApaMetadataAction(input: any) { return callFirebaseFlow('extractApaMetadataFlow', input); }
export async function processExamRegulationsAction(input: any) { return callFirebaseFlow('processExamRegulationsFlow', input); }
export async function getLivePortfolioFeedbackAction(input: any) { return callFirebaseFlow('getLivePortfolioFeedbackFlow', input); }
export async function designSectionOutlineAction(input: any) { return callFirebaseFlow('designSectionOutlineFlowFlow', input); }
export async function generateConceptVideoScriptAction(input: Types.GenerateConceptVideoScriptInput) {
    console.log(">>> ACTION TRIGGERED: generateConceptVideoScriptAction", input.concept);

    const normalizedTerm = input.concept.toLowerCase().trim().replace(/\s+/g, '-');
    const docRef = adminFirestore.collection('conceptVideos').doc(normalizedTerm);

    try {
        // 1. Tjek om videoen findes i cachen
        const snap = await docRef.get();
        if (snap.exists) {
            console.log(">>> ACTION: Fundet eksisterende video i Firestore.");
            return {
                data: snap.data() as Types.GenerateConceptVideoScriptOutput['data'],
                usage: { inputTokens: 0, outputTokens: 0 }
            };
        }

        // 2. Generer ny video hvis ikke i cache
        const res = await callFirebaseFlow('generateConceptVideoScriptFlow', input);
        const script = res.data;

        // 3. Upload medier til Storage for at undgå enorme payloads og hit document limit
        console.log(">>> ACTION: Uploader medier til Storage for persistens...");
        const scenesWithUrls = await Promise.all(script.scenes.map(async (scene) => {
            const updatedScene = { ...scene };

            // Upload audio
            if (scene.audioDataUri && scene.audioDataUri.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-audio.mp3`;
                updatedScene.audioDataUri = await uploadMediaToStorage(scene.audioDataUri, path);
            }

            // Upload video (fra Veo)
            if (scene.videoUrl && scene.videoUrl.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-video.mp4`;
                updatedScene.videoUrl = await uploadMediaToStorage(scene.videoUrl, path);
            }

            // Upload image (fra Banana)
            if (scene.imageUrl && scene.imageUrl.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-image.png`;
                updatedScene.imageUrl = await uploadMediaToStorage(scene.imageUrl, path);
            }

            return updatedScene;
        }));

        const finalScript = { ...script, scenes: scenesWithUrls };

        // 4. Gem i Firestore
        await docRef.set(finalScript);
        console.log(">>> ACTION: Video gemt i Firestore.");

        return { data: finalScript, usage: res.usage };
    } catch (e: any) {
        console.error(">>> ACTION ERROR in generateConceptVideoScriptAction:", e.message);
        throw new Error(`Fejl under videogenerering: ${e.message}`);
    }
}



// --- OneNote Integration Actions ---

export async function getMicrosoftAuthUrlAction() {
  const clientId = process.env.AZURE_CLIENT_ID;
  
  // Use environment variable if set, otherwise try to detect host from headers
  let redirectUri = process.env.AZURE_REDIRECT_URI;
  
  if (!redirectUri) {
    try {
      const host = headers().get('host');
      const protocol = host?.includes('localhost') ? 'http' : 'https';
      redirectUri = `${protocol}://${host}/api/auth/callback/microsoft`;
    } catch (e) {
      redirectUri = 'https://student.cohero.dk/api/auth/callback/microsoft';
    }
  }
  
  if (!clientId) {
    throw new Error("Missing AZURE_CLIENT_ID in environment variables");
  }

  const scopes = ['Notes.Read', 'offline_access', 'User.Read'].join(' ');
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}`;
  
  return url;
}

export async function listOneNoteNotebooksAction() {
  const { adminAuth: auth } = await import('@/firebase/server-init');
  const session = await auth.verifyIdToken(cookies().get('__session')?.value || '');
  if (!session) throw new Error("Unauthorized");

  const { getMicrosoftAccessToken, listNotebooks } = await import('@/lib/integrations/onenote');
  const token = await getMicrosoftAccessToken(session.uid);
  if (!token) return [];

  return listNotebooks(token);
}

export async function syncOneNoteNotebookAction(notebookId: string) {
  const { adminAuth: auth } = await import('@/firebase/server-init');
  const session = await auth.verifyIdToken(cookies().get('__session')?.value || '');
  if (!session) throw new Error("Unauthorized");

  const { syncOneNoteToCohero } = await import('@/lib/integrations/onenote');
  return syncOneNoteToCohero(session.uid, notebookId);
}

// --- STAR API Actions ---

const STAR_BASE_URL = 'https://api.jobindsats.dk/v2';

export async function fetchStarSubjectsAction(): Promise<any[]> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler. Kontakt venligst administratoren.");
    }

    try {
        const response = await fetch(`${STAR_BASE_URL}/subjects/json`, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Subjects Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTablesAction(subjectId: string | number): Promise<any[]> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    try {
        const response = await fetch(`${STAR_BASE_URL}/tables?subjectid=${subjectId}`, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Tables Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTableDetailsAction(tableId: string): Promise<any> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    const url = `${STAR_BASE_URL}/tables/${tableId}/json`;
    console.log("STAR Table Details Fetch URL (Server):", url);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR Tabel-detaljer fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Table Details Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTableDataAction(tableId: string, filters: Record<string, string[]>, format: 'json' | 'csv' = 'json'): Promise<any> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    // Construct query string
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] && filters[key].length > 0) {
            // Join array values with commas as per STAR API pattern
            params.append(key, filters[key].join(','));
        }
    }

    const queryString = params.toString();
    const url = `${STAR_BASE_URL}/data/${tableId}/${format}?${queryString}`;

    // Log the constructed URL for debugging as requested by user
    console.log(`STAR Data Fetch URL (${format}) (Server):`, url);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`STAR Data Fetch Error (${response.status}):`, errorText);
            throw new Error(`Kald til STAR Data fejlede: ${response.statusText}`);
        }

        if (format === 'csv') {
            return await response.text();
        }
        return await response.json();
    } catch (error: any) {
        console.error("STAR Table Data Fetch Error:", error);
        throw error;
    }
}

// --- Retsinformation API Actions ---

export async function fetchLawTimeline(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/${String(uniqueDocumentId)}/timeline`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch law timeline for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        // Typically returns an array of events
        return data || [];
    } catch (error) {
        console.error("Failed to fetch law timeline:", error);
        return [];
    }
}

/**
 * Fetches associated documents (cirkulærer, bekendtgørelser, etc.) for a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/3/(UniqueDocumentId)
 */
export async function fetchRelatedDocumentLinks(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/3/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch related document links for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        // Returns an array of related document objects
        return data || [];
    } catch (error) {
        console.error("Failed to fetch related document links:", error);
        return [];
    }
}

/**
 * Fetches related decisions (principmeddelelser) for a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/6/(UniqueDocumentId)
 */
export async function fetchRelatedDecisions(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/6/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch related decisions for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Failed to fetch related decisions:", error);
        return [];
    }
}

/**
 * Fetches Ombudsmand reports related to a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/5/(UniqueDocumentId)
 */
export async function fetchOmbudsmandReports(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/5/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch Ombudsmand reports for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Failed to fetch Ombudsmand reports:", error);
        return [];
    }
}

// --- Folketinget ODA Actions ---

export async function fetchFolketingetSagByLovnummer(lovnummer: string, dato: string): Promise<any> {
    // dato is expected in dd.mm.yyyy
    const parts = dato.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;

    // Construct filter for ODA API
    const filter = `lovnummer eq '${lovnummer}' and year(lovnummerdato) eq ${year} and month(lovnummerdato) eq ${parseInt(month)} and day(lovnummerdato) eq ${parseInt(day)}`;
    const url = `https://oda.ft.dk/api/Sag?$filter=${encodeURIComponent(filter)}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return null;
        const data = await response.json();
        // Return the first matching case (Sag)
        return data.value?.[0] || null;
    } catch (error) {
        console.error("Failed to fetch sag by lovnummer from Folketinget ODA:", error);
        return null;
    }
}

// Stripe and other Server Actions
export async function createCheckoutSession(params: { priceId: string, userId: string, userEmail?: string, userName?: string, stripeCustomerId?: string | null, originPath?: string, trialDays?: number }): Promise<{ success: boolean, sessionId?: string, stripeCustomerId?: string, error?: string }> {
    if (!isStripeConfigured) {
        return { success: false, error: 'Betalingssystemet er ikke konfigureret korrekt på serveren (mangler API-nøgle).' };
    }

    const { priceId, userId, userEmail, userName, stripeCustomerId, originPath, trialDays } = params;

    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const basePath = originPath || '/portal';
    const separator = basePath.includes('?') ? '&' : '?';
    const success_url = `${origin}${basePath}${separator}success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}${basePath}`;

    let customerId = stripeCustomerId;

    if (!customerId) {
        try {
            const customer = await stripe.customers.create({
                email: userEmail,
                name: userName,
                metadata: {
                    firebaseUID: userId,
                },
            });
            customerId = customer.id;
        } catch (e: any) {
            console.error('Error creating Stripe customer:', e);
            return { success: false, error: `Kunne ikke oprette kunde i Stripe: ${e.message}` };
        }
    }

    try {
        // Determine trial days based on price type if not explicitly provided
        let finalTrialDays = trialDays;
        if (finalTrialDays === undefined) {
             const membership = getMembershipFromPriceId(priceId);
             finalTrialDays = membership === 'Kollega+' ? 7 : 0;
        }

        // --- FIRST TIME CUSTOMER CHECK ---
        // If they already have a customer ID, check if they have (or had) any subscriptions before
        if (customerId && finalTrialDays > 0) {
            try {
                const pastSubscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'all',
                    limit: 1,
                });
                if (pastSubscriptions.data.length > 0) {
                    console.log(`[StripeCheckout] Returning customer ${customerId} detected. Disabling trial.`);
                    finalTrialDays = 0;
                }
            } catch (err) {
                console.warn("[StripeCheckout] Could not verify past subscriptions, defaulting to 0 trial for safety:", err);
                finalTrialDays = 0;
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customerId || undefined,
            client_reference_id: userId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            subscription_data: finalTrialDays > 0 ? {
                trial_period_days: finalTrialDays,
            } : undefined,
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: success_url,
            cancel_url: cancel_url,
        });

        if (!session.id) {
            return { success: false, error: 'Stripe session ID mangler efter oprettelse.' };
        }

        return { success: true, sessionId: session.id, stripeCustomerId: customerId || undefined };
    } catch (error: any) {
        console.error('Stripe session creation error:', error);
        return { success: false, error: `Stripe fejl: ${error.message}` };
    }
}

export async function processStripeSession(sessionId: string): Promise<{ success: boolean; message: string; updateData?: any }> {
    if (!isStripeConfigured) {
        return { success: false, message: 'Betalingssystemet er ikke konfigureret.' };
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (session.status !== 'complete') {
            return { success: false, message: 'Betaling ikke fuldført.' };
        }

        const subscription = session.subscription as Stripe.Subscription;
        if (!subscription) {
            throw new Error('Subscription not found on session.');
        }

        const price = subscription.items.data[0].price;
        const membershipLevel = getMembershipFromPriceId(price.id);

        const updateData = {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: price.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            membership: membershipLevel,
            stripeCancelAtPeriodEnd: false,
        };

        if (session.customer_details?.email) {
            try {
                const { subject, body } = await callFirebaseFlow('generateSubscriptionConfirmationEmailFlow', {
                    userName: session.customer_details.name || 'Kollega',
                    membershipLevel: membershipLevel,
                });
                
                await resend.emails.send({
                    from: 'Cohéro <kontakt@cohero.dk>',
                    to: session.customer_details.email,
                    subject: subject,
                    html: body,
                });
            } catch (emailError) {
                console.error("Confirmation email failed to send:", emailError);
            }
        }

        return { success: true, message: 'Subscription data retrieved.', updateData };

    } catch (error: any) {
        console.error('Error processing Stripe session:', error);
        return { success: false, message: error.message };
    }
}

export async function createPortalSession(stripeCustomerId: string): Promise<{ url: string }> {
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${origin}/settings`,
        });
        return { url: portalSession.url };
    } catch (e: any) {
        console.error(e);
        throw new Error('Failed to create portal session');
    }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string; }> {
    try {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        return { success: true, message: "Dit abonnement er blevet opsagt og vil ikke blive fornyet." };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: error.message };
    }
}

export async function createPortalSessionAction(stripeCustomerId: string): Promise<{ url: string }> {
    if (!isStripeConfigured) throw new Error("Stripe er ikke konfigureret.");
    
    // We use headers to get the dynamic host if NEXT_PUBLIC_APP_URL is missing
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${baseUrl}/settings`,
        });
        return { url: portalSession.url };
    } catch (error: any) {
        console.error("Stripe Portal Error:", error);
        throw new Error(error.message);
    }
}

export async function syncSubscriptionStatusAction(stripeCustomerId: string): Promise<{
    stripeSubscriptionStatus: string;
    stripeCurrentPeriodEnd: string | null;
    membership: string;
    stripeCancelAtPeriodEnd: boolean;
    stripePriceId: string;
    stripeSubscriptionId: string;
} | null> {
    if (!isStripeConfigured) return null;

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
            status: 'all',
        });

        if (subscriptions.data.length === 0) return null;

        const sub = subscriptions.data[0];
        const price = sub.items.data[0].price;
        const membershipLevel = getMembershipFromPriceId(price.id);

        // We only grant premium membership if the status is active or trialing
        const isActive = sub.status === 'active' || sub.status === 'trialing';

        return {
            stripeSubscriptionStatus: sub.status,
            stripeCurrentPeriodEnd: safeIsoDate(sub.current_period_end),
            membership: isActive ? membershipLevel : 'Kollega',
            stripeCancelAtPeriodEnd: sub.cancel_at_period_end,
            stripePriceId: price.id,
            stripeSubscriptionId: sub.id,
        };
    } catch (e) {
        // Only log errors if customer was provided.
        if (stripeCustomerId) {
            console.error('Error syncing Stripe subscription:', e);
        }
        return null;
    }
}

// Other Server Actions
export async function sendBugReport(reportText: string, pathname: string, username: string, email: string): Promise<{ success: boolean; message: string; }> {
    try {
        
        await resend.emails.send({
            from: 'Cohéro Bug Rapport <kontakt@cohero.dk>',
            to: 'kontakt@cohero.dk',
            subject: `Ny Fejlrapport fra: ${username}`,
            html: `
        <p><strong>Bruger:</strong> ${username} (${email})</p>
        <p><strong>Side:</strong> ${pathname}</p>
        <hr>
        <p><strong>Rapport:</strong></p>
        <p>${reportText}</p>
      `,
        });
        return { success: true, message: 'Din fejlrapport er blevet sendt. Tak for hjælpen!' };
    } catch (error) {
        console.error('Failed to send bug report:', error);
        return { success: false, message: 'Kunne ikke sende rapport. Prøv igen senere.' };
    }
}

export async function sendTaskResetEmailAction(recipientEmail: string, taskTitle: string) {
    try {
        
        await resend.emails.send({
            from: 'Cohéro Markedsplads <info@platform.cohero.dk>',
            to: recipientEmail,
            subject: `Opdatering: Din opgave '${taskTitle}' er åben igen`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f3f4f6; border-radius: 20px;">
                    <h2 style="color: #451a03; font-family: serif;">Din opgave er lagt op på markedspladsen igen</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Hej!<br><br>
                        Vi skriver til dig for at informere om, at din opgave <strong>"${taskTitle}"</strong> er blevet nulstillet af en administrator og nu er synlig for alle kvalificerede studerende på markedspladsen igen.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Dette sker typisk hvis den tidligere hjælper ikke længere kan løse opgaven, eller hvis vi vurderer at en anden studerende vil være et bedre match.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Du vil modtage en ny mail, så snart en anden studerende tager opgaven.
                    </p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                        Med venlig hilsen<br>
                        <strong>Cohéro Teamet</strong>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to send task reset email:", error);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendEmailToConsultant(subject: string, message: string, userName: string, userEmail: string): Promise<{ success: boolean; message: string; }> {
    try {
        
        await resend.emails.send({
            from: 'Cohéro Spørgsmål <info@platform.cohero.dk>',
            to: 'kontakt@cohero.dk',
            reply_to: userEmail,
            subject: `Spørgsmål fra ${userName}: ${subject}`,
            html: `<p>Fra: ${userName} (${userEmail})</p><p>${message}</p>`,
        });
        return { success: true, message: 'Din besked er sendt!' };
    } catch (error) {
        console.error('Failed to send consultant email:', error);
        return { success: false, message: 'Kunne ikke sende besked.' };
    }
}

export async function fetchPoliticalNews(): Promise<any[]> {
    try {
        const response = await fetch('https://www.dr.dk/nyheder/service/feeds/politik', { next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const text = await response.text();
        const items = [...text.matchAll(/<item>(.*?)<\/item>/gs)];
        return items.map(item => {
            const title = item[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] || '';
            const link = item[1].match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/s)?.[1] || '';
            const pubDate = item[1].match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
            return { title, link, pubDate };
        });
    } catch (error) {
        console.error("Failed to fetch DR news:", error);
        return [];
    }
}

export async function fetchSocialMinistryNews(): Promise<any[]> {
    try {
        const response = await fetch('https://www.sm.dk/handlers/DynamicRss.ashx?id=d66aadb0-8d96-4027-9a8f-7a3176ad49f9', { next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const text = await response.text();
        const items = [...text.matchAll(/<item>(.*?)<\/item>/gs)];
        return items.map(item => {
            const title = item[1].match(/<title>(.*?)<\/title>/s)?.[1] || '';
            const link = item[1].match(/<link>(.*?)<\/link>/s)?.[1] || '';
            const pubDate = item[1].match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
            return { title, link, pubDate };
        });
    } catch (error) {
        console.error("Failed to fetch SM news:", error);
        return [];
    }
}
export async function fetchFolketingetMetadataAction() {
    try {
        const [typerRes, statusserRes] = await Promise.all([
            fetch('https://oda.ft.dk/api/Sagstype', { headers: { 'Accept': 'application/json' } }).then(r => r.json()),
            fetch('https://oda.ft.dk/api/Sagsstatus', { headers: { 'Accept': 'application/json' } }).then(r => r.json())
        ]);
        return {
            typer: typerRes.value || [],
            statusser: statusserRes.value || []
        };
    } catch (error) {
        console.error("Failed to fetch FT metadata:", error);
        return { typer: [], statusser: [] };
    }
}

export async function fetchFolketingetSager(params: { searchTerm?: string, typeId?: number | null, statusId?: number | null, followedIds?: number[] | null, skip?: number, top?: number }): Promise<any[]> {
    const { searchTerm, typeId, statusId, followedIds, skip = 0, top = 10 } = params;

    if (params.followedIds && (!followedIds || followedIds.length === 0)) {
        return [];
    }

    // 1. Create a unique cache key based on params
    const cacheKey = Buffer.from(JSON.stringify({ searchTerm, typeId, statusId, followedIds, skip, top })).toString('base64');
    const cacheRef = adminFirestore.collection('folketingetCache').doc(cacheKey);

    try {
        // 2. Try to get from cache first
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
            const data = cacheSnap.data();
            const now = Date.now();
            const cacheAge = now - (data?.timestamp?.toMillis() || 0);
            
            // Cache valid for 24 hours
            if (cacheAge < 24 * 60 * 60 * 1000) {
                console.log(">>> ACTION: Serving Folketinget Sager from cache.");
                return data?.sager || [];
            }
        }
    } catch (e) {
        console.error("Cache fetch failed, falling back to live API:", e);
    }

    let filters: string[] = [];
    if (searchTerm) {
        const escapedSearchTerm = searchTerm.replace(/'/g, "''");
        filters.push(`substringof('${escapedSearchTerm}', titel) eq true`);
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        filters.push(`opdateringsdato gt datetime'${fiveYearsAgo.toISOString().split('.')[0]}'`);
    }

    if (typeId) filters.push(`typeid eq ${typeId}`);
    if (statusId) filters.push(`statusid eq ${statusId}`);

    if (followedIds) {
        filters.push(`(${followedIds.map(id => `id eq ${id}`).join(' or ')})`);
    }

    const filterString = filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
    const url = `https://oda.ft.dk/api/Sag?$inlinecount=allpages&${filterString}&$orderby=opdateringsdato desc&$skip=${skip}&$top=${top}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            console.error(`Failed to fetch Folketinget sager. Status: ${response.status}, URL: ${url}`);
            return [];
        }
        const data = await response.json();
        const sager = data.value || [];

        // 3. Save to cache asynchronously
        cacheRef.set({
            sager,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("Failed to update FT cache:", err));

        return sager;
    } catch (error) {
        console.error("Failed to fetch Folketinget sager:", error);
        return [];
    }
}

export async function fetchFolketingetSagById(id: number): Promise<any> {
    const url = `https://oda.ft.dk/api/Sag(${id})?$expand=Sagstrin`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch sag by ID:", error);
        return [];
    }
}

export async function fetchSagDokumenter(sagId: number): Promise<any[]> {
    console.log(`[ODA] Fetching documents for Sag ID: ${sagId}`);
    const sagDokUrl = `https://oda.ft.dk/api/SagDokument?$filter=sagid eq ${sagId}`;
    try {
        const response = await fetch(sagDokUrl, { 
            headers: { 
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`[ODA] Failed to fetch SagDokument list: ${response.status}`);
            return [];
        }
        const data = await response.json();
        const value = data.value || [];
        console.log(`[ODA] Found ${value.length} document references.`);
        
        // Enrich with Dokument details and Fil details
        const enriched = await Promise.all(value.map(async (item: any) => {
            try {
                const dokUrl = `https://oda.ft.dk/api/Dokument(${item.dokumentid})?$expand=Fil`;
                const dokRes = await fetch(dokUrl, { 
                    headers: { 
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    } 
                });
                if (dokRes.ok) {
                    item.Dokument = await dokRes.json();
                }
            } catch (e) {
                console.warn(`[ODA] Failed to enrich document ${item.dokumentid}`);
            }
            return item;
        }));

        return enriched;
    } catch (error) {
        console.error("[ODA] Critical error in fetchSagDokumenter:", error);
        return [];
    }
}

/**
 * fetchFolketingetPdfAction:
 * Fetches a PDF from ft.dk using browser-like headers to bypass bot protection.
 */
export async function fetchFolketingetPdfAction(url: string) {
    const isOda = url.includes('oda.ft.dk');
    const targetUrl = isOda ? url.replace('https://', 'http://') : url;
    
    console.log(`[BYPASS-PROXY] Attempting primary fetch: ${targetUrl}`);
    
    const headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/pdf, */*',
    };

    try {
        // Try Direct Fetch First
        let response = await fetch(targetUrl, { headers, redirect: 'follow', cache: 'no-store' });

        // If Direct Fetch fails (403/501), try Proxy Fallback
        if (!response.ok) {
            console.warn(`[BYPASS-PROXY] Primary fetch failed (${response.status}). Trying Proxy Fallback...`);
            
            // Proxy 1: AllOrigins (Free, open)
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            console.log(`[BYPASS-PROXY] Trying Proxy 1 (AllOrigins): ${proxyUrl}`);
            
            response = await fetch(proxyUrl, { cache: 'no-store' });
            
            if (!response.ok) {
                // Proxy 2: CORS Proxy Fallback
                const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
                console.log(`[BYPASS-PROXY] Trying Proxy 2 (CORSProxy): ${proxyUrl2}`);
                response = await fetch(proxyUrl2, { cache: 'no-store' });
            }
        }

        if (!response.ok) {
            console.error(`[BYPASS-PROXY] All fetch attempts failed for ${targetUrl}`);
            return { error: `Kunne ikke hente fil (Status: ${response.status})`, base64: "", contentType: "" };
        }

        const buffer = await response.arrayBuffer();
        console.log(`[BYPASS-PROXY] SUCCESS! Size: ${buffer.byteLength} bytes.`);
        
        return {
            base64: Buffer.from(buffer).toString('base64'),
            contentType: response.headers.get('content-type') || 'application/pdf'
        };
    } catch (error) {
        console.error(`[BYPASS-PROXY] Critical failure:`, error);
        return { error: "Network failure during proxy fetch", base64: "", contentType: "" };
    }
}


export async function fetchDagsordenspunkter(sagId: number): Promise<any[]> {
    const url = `https://oda.ft.dk/api/DagsordenspunktSag?&$filter=sagid eq ${sagId}&$expand=Dagsordenspunkt($expand=Møde,Dokument($expand=Fil))&$orderby=Dagsordenspunkt/Møde/dato desc`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch dagsordenspunkter:", error);
        return [];
    }
}

export async function fetchLatestDecisions(): Promise<any[]> {
    const url = "https://www.retsinformation.dk/api/documentsearch?dt=230&dt=240&dt=250&dt=260&dt=980&o=80&ps=100&r=188";
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const data = await response.json();
        return data.documents || data.items || data || [];
    } catch (error) {
        console.error("Failed to fetch latest decisions:", error);
        return [];
    }
}

export async function checkFollowedSagerUpdatesAction(userId: string, userEmail: string) {
    try {
        const followedSagerCol = adminFirestore.collection('followedSager');
        const snapshot = await followedSagerCol.where('userId', '==', userId).get();

        
        if (snapshot.empty) return { updatedCount: 0 };
        
        let updatedCount = 0;
        const updates: { sagId: number, title: string, oldStatusId: number, newStatusId: number }[] = [];

        for (const docRef of snapshot.docs) {
            const data = docRef.data();

            const sagId = data.sagId;
            const currentStatusId = data.statusId;
            
            // Fetch latest from ODA
            const latestSag = await fetchFolketingetSagById(sagId);
            if (latestSag && latestSag.statusid !== currentStatusId) {
                // Status changed!
                updatedCount++;
                
                // Update Firestore
                await docRef.ref.update({
                    statusId: latestSag.statusid,
                    lastUpdatedAt: FieldValue.serverTimestamp()
                });
                
                updates.push({
                    sagId: sagId,
                    title: latestSag.titel,
                    oldStatusId: currentStatusId,
                    newStatusId: latestSag.statusid
                });

                
                // Send In-App Notification
                await sendInAppNotificationAction({
                    uid: userId,
                    title: "Statusændring på fulgt sag! 🏛️",
                    body: `Sagen "${latestSag.titel}" har skiftet status.`,
                    type: 'success',
                    link: `/folketinget/case/view/${sagId}`
                });
            }
        }
        
        if (updatedCount > 0 && userEmail) {
            // Optionally send a single summary email
            await generateCaseUpdateEmailAction({
                userEmail,
                userName: "Bruger",
                caseTitle: updates.length === 1 ? updates[0].title : `${updatedCount} sager`,
                caseUrl: `https://student.cohero.dk/folketinget`
            });
        }

        return { updatedCount };
    } catch (error) {
        console.error("Failed to check followed sager updates:", error);
        return { updatedCount: 0, error: true };
    }
}


export async function fetchPrincipmeddelelserAction(lawName: string): Promise<any[]> {
    const cleanName = lawName.replace(/bekendtgørelse af\s+/i, '').trim();
    const encodedLaw = encodeURIComponent(cleanName);
    const url = `https://www.retsinformation.dk/api/documentsearch?dt=230&dt=240&dt=250&dt=260&dt=980&ps=20&r=188&t=Ankestyrelsens%20principmeddelelse&t=${encodedLaw}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const data = await response.json();
        const items = data.documents || data.items || data || [];

        return items.map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            title: item.title || item.name || 'Uden titel',
            publicationDate: item.offentliggoerelsesDato || item.publicationDate || 'Ukendt dato',
            retsinfoLink: item.retsinfoLink ? `https://www.retsinformation.dk${item.retsinfoLink}` : '',
            abbreviation: item.documentTypeEliCode || 'Afg.'
        }));
    } catch (error) {
        console.error("Failed to fetch principmeddelelser:", error);
        return [];
    }
}

export async function recommendTaskAssigneeAction(input: any) { return callFirebaseFlow('recommendTaskAssigneeFlow', input); }

export async function queueNotificationAction(input: { title: string, body: string, recipientUids: string[], sentBy: string, targetGroup: string }) {
    try {
        let targets: string[] = input.recipientUids;

        // If 'all', fetch all user UIDs
        if (input.targetGroup === 'all') {
            const usersSnapshot = await adminFirestore.collection('users').select().get();
            targets = usersSnapshot.docs.map(doc => doc.id);
        }

        // 1. Push notification queue (for the background function to pick up)
        await adminFirestore.collection('notifications_queue').add({
            ...input,
            recipientUids: targets,
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });

        // 2. Add to each recipient's in-app notification list
        const chunks: string[][] = [];
        for (let i = 0; i < targets.length; i += 500) {
            chunks.push(targets.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const batch = adminFirestore.batch();
            for (const uid of chunk) {
                const notifRef = adminFirestore.collection('users').doc(uid).collection('notifications').doc();
                batch.set(notifRef, {
                    title: input.title,
                    body: input.body,
                    type: 'info',
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    sentBy: input.sentBy,
                    sourceGroup: input.targetGroup
                });
            }
            await batch.commit();
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to queue notification:", error);
        return { success: false, message: error.message };
    }
}

export async function sendInAppNotificationAction(input: { uid: string, title: string, body: string, type: string, link?: string }) {
    try {
        // 1. In-App Notification (Firestore subcollection)
        await adminFirestore.collection('users').doc(input.uid).collection('notifications').add({
            title: input.title,
            body: input.body,
            type: input.type,
            link: input.link || '',
            read: false,
            createdAt: FieldValue.serverTimestamp()
        });

        // 2. Queue Push Notification (for Devices)
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
    } catch (error: any) {
        console.error("Failed to send notification:", error);
        return { success: false, message: error.message };
    }
}

export async function addGroupMemberByEmailAction(input: { groupId: string, email: string, inviterId: string, inviterName: string }) {
    const { groupId, email, inviterId, inviterName } = input;

    try {
        // 1. Find user by email
        const userSnap = await adminFirestore.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();

        if (userSnap.empty) {
            return { success: false, message: 'Bruger ikke fundet.' };
        }

        const targetUser = userSnap.docs[0];
        const targetUserId = targetUser.id;
        const targetUserName = targetUser.data().username || 'Kollega';

        // 2. Check if already member
        const groupRef = adminFirestore.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) return { success: false, message: 'Gruppe ikke fundet.' };

        const groupData = groupDoc.data();
        const memberIds = groupData?.memberIds || [];

        if (memberIds.includes(targetUserId)) {
            return { success: false, message: 'Brugeren er allerede medlem af denne gruppe.' };
        }

        // 3. Perform batch update
        const batch = adminFirestore.batch();

        const memberDocRef = groupRef.collection('members').doc(targetUserId);
        batch.set(memberDocRef, {
            id: targetUserId,
            email: email.toLowerCase(),
            role: 'member',
            joinedAt: FieldValue.serverTimestamp()
        });

        batch.update(groupRef, {
            memberIds: FieldValue.arrayUnion(targetUserId),
            membersCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return {
            success: true,
            targetUserId,
            targetUserName,
            groupName: groupData?.name
        };
    } catch (error: any) {
        console.error("Add member action error:", error);
        return { success: false, message: error.message };
    }
}
export async function twistBlueprintAction(input: { blueprintTitle: string; currentProblemStatement: string; twist: string }) {
    const result = await callFirebaseFlow('twistBlueprintFlowFlow', input);
    return {
        data: result.data,
        usage: result.usage
    };
}

export async function toggleViveAreaFollowAction(userId: string, areaId: string) {
    try {
        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error('User not found');

        const data = userDoc.data();
        const followed = data?.followedViveAreas || [];

        if (followed.includes(areaId)) {
            await userRef.update({
                followedViveAreas: FieldValue.arrayRemove(areaId)
            });
            return { success: true, followed: false };
        } else {
            await userRef.update({
                followedViveAreas: FieldValue.arrayUnion(areaId)
            });
            return { success: true, followed: true };
        }
    } catch (error: any) {
        console.error(`[toggleViveAreaFollowAction] Error for user ${userId}, area ${areaId}:`, error);
        return { success: false, message: error.message };
    }
}
export async function generateEvidenceTagsAction(input: any) {
    try {
        return await callFirebaseFlow('generateEvidenceTagsFlow', input);
    } catch (e) {
        console.error("AI Tags error:", e);
        return { tags: [] };
    }
}

export async function organizeEvidenceIntoSeminarAction(input: any) {
    try {
        return await callFirebaseFlow('organizeEvidenceIntoSeminarFlow', input);
    } catch (e: any) {
        console.error("Organize evidence error:", e);
        throw new Error(`Fejl ved organisering af evidens: ${e.message}`);
    }
}

export async function chatWithEvidenceContentAction(input: any) {
    return callFirebaseFlow('chatWithEvidenceContentFlow', input);
}


export async function detectAiContentAction(input: { text: string }) {
    return await callFirebaseFlow('detectAiContentContentFlow', input);
}


export async function draftEmailAction(topic: string) {
    try {
        const result = await callFirebaseFlow('draftEmailFlow', { topic });
        return { success: true, data: result.data };
    } catch (e: any) {
        console.error("Draft Email Error:", e);
        return { success: false, message: e.message };
    }
}



export async function getUserUidByEmailAction(email: string): Promise<{ success: boolean; uid?: string; name?: string; message?: string }> {
    try {
        const snap = await adminFirestore.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
        if (snap.empty) return { success: false, message: 'Bruger ikke fundet.' };
        const userDoc = snap.docs[0];
        return { 
            success: true, 
            uid: userDoc.id, 
            name: userDoc.data().username || userDoc.data().displayName || 'En kollega' 
        };
    } catch (e) {
        console.error("Failed to lookup user:", e);
        return { success: false, message: 'Der skete en fejl ved opslag.' };
    }
}

export async function scanStudentCardAction(input: Types.ScanStudentCardInput): Promise<any> {
    try {
        const result = await callFirebaseFlow('scanStudentCardFlow', input);
        return { success: true, ...result };
    } catch (e: any) {
        console.error("scanStudentCardAction failed:", e);
        return { 
            success: false, 
            error: e.message || "Scanning fejlede.", 
            details: process.env.NODE_ENV === 'development' ? e.stack : undefined 
        };
    }
}

export async function updateStudentCardVerificationAction(userId: string, verification: any) {
    try {
        await adminFirestore.collection('users').doc(userId).update({
            studentCardVerification: {
                ...verification,
                scannedAt: FieldValue.serverTimestamp()
            }
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to update student card verification:", e);
        return { success: false, error: "Failed to update" };
    }
}

export async function toggleMarketplaceBanAction(userId: string, isBanned: boolean, reason?: string) {
    try {
        const { adminFirestore, admin } = await import('@/firebase/server-init');
        await adminFirestore.collection('users').doc(userId).update({
            isMarketplaceBanned: isBanned,
            marketplaceBanReason: isBanned ? reason : null,
            marketplaceBannedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to toggle marketplace ban:", e);
        return { success: false, error: "Fejl ved opdatering af udelukkelse." };
    }
}

export async function clearUserPaymentInfoAction(userId: string, studentCardUrl?: string) {
    try {
        const { adminFirestore, adminStorage, admin } = await import('@/firebase/server-init');
        const FieldValue = admin.firestore.FieldValue;
        
        await adminFirestore.collection('users').doc(userId).update({
            cprNumber: FieldValue.delete(),
            bankReg: FieldValue.delete(),
            bankAccount: FieldValue.delete(),
            studentCardUrl: FieldValue.delete(),
            studentCardVerification: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp()
        });

        if (studentCardUrl) {
            try {
                const bucket = adminStorage.bucket();
                const file = bucket.file(studentCardUrl);
                await file.delete();
            } catch (err) {
                console.warn("Storage deletion ignored:", err);
            }
        }
        return { success: true };
    } catch (e) {
        console.error("Failed to clear payment info:", e);
        return { success: false, error: "Fejl ved sletning af oplysninger." };
    }
}
export async function getLiveMarketAnalysisAction(input: { 
    features: string[], 
    currentArr: number,
    strategicScores: { technology: number, architecture: number, ip: number, team: number, data: number }
}) {
    try {
        const analysis = await callFirebaseFlow('marketAnalysisFlow', input);
        if (analysis) {
            // Automatically save the latest successful analysis with its inputs
            await saveMarketAnalysisAction({ 
                ...analysis, 
                inputUsed: input 
            });
        }
        return analysis;
    } catch (e: any) {
        console.error("Market analysis failed:", e);
        throw new Error(`Fejl ved markedsanalyse: ${e.message}`);
    }
}

export async function saveMarketAnalysisAction(analysis: any) {
    try {
        const { adminFirestore } = await import('@/firebase/server-init');
        await adminFirestore.collection('system_intelligence').doc('latest_market_analysis').set({
            ...analysis,
            savedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to save market analysis:", e);
        return { success: false };
    }
}

export async function getLatestMarketAnalysisAction() {
    try {
        const { adminFirestore } = await import('@/firebase/server-init');
        const doc = await adminFirestore.collection('system_intelligence').doc('latest_market_analysis').get();
        if (doc.exists) return { success: true, data: doc.data() };
        return { success: false };
    } catch (e) {
        console.error("Failed to fetch market analysis:", e);
        return { success: false };
    }
}

export async function adminDeleteUserAction(userId: string) {
    try {
        const { adminAuth } = await import('@/firebase/server-init');
        
        // Delete the Auth user.
        // This will trigger the onUserDeleteCleanUp Cloud Function to clean up Firestore!
        await adminAuth.deleteUser(userId);
        
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete user in admin action:", e);
        return { success: false, error: e.message || "Kunne ikke slette brugeren fra Auth." };
    }
}

export async function getStripeDashboardMetricsAction() {
    if (!isStripeConfigured) {

        return { success: false, error: "Stripe er ikke konfigureret." };
    }

    try {
        let totalMrrCents = 0;
        let activeSubsCount = 0;
        let trialSubsCount = 0;
        let potentialMrrFromTrialsCents = 0;
        
        const counts = {
            'Semesterpakken': 0,
            'Kollega+': 0,
            'Group Pro': 0,
            'Andre': 0
        };

        // 1. Fetch all active and trialing subscriptions across all prices
        // Using auto-pagination to ensure we get ALL subscriptions (more than the 100 limit)
        for await (const sub of stripe.subscriptions.list({
            status: 'all',
            expand: ['data.plan.product', 'data.discount.coupon'],
        })) {
            if (sub.status !== 'active' && sub.status !== 'trialing') continue;

            const isTrial = sub.status === 'trialing';
            if (isTrial) trialSubsCount++;
            else activeSubsCount++;
            
            let subscriptionMrrCents = 0;

            // Step 1: Calculate Gross MRR for this subscription's items
            for (const item of sub.items.data) {
                const price = item.price;
                const amount = price.unit_amount || 0;
                const quantity = item.quantity || 1;
                
                let itemMonthlyCents = (amount * quantity) / (price.recurring?.interval_count || 1);
                if (price.recurring?.interval === 'year') {
                    itemMonthlyCents /= 12;
                }
                
                subscriptionMrrCents += itemMonthlyCents;
                
                // Track counts by type (using price ID) for ACTIVE subs only (so we don't mix reports)
                if (!isTrial) {
                    const pid = price.id;
                    if (pid === process.env.STRIPE_GROUP_PRO_PRICE_ID || pid === process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID) {
                        counts['Group Pro']++;
                    } else if (pid === process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID || pid === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID) {
                        counts['Kollega+']++;
                    } else if (pid === process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID || pid === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID) {
                        counts['Kollega+']++; 
                    } else if (pid === process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID || pid === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID) {
                        counts['Semesterpakken']++;
                    } else {
                        counts['Andre']++;
                    }
                }
            }

            // Step 2: Apply active discounts/coupons to the subscription's MRR
            if (sub.discount && sub.discount.coupon) {
                const coupon = sub.discount.coupon;
                if (coupon.amount_off) {
                    // Normalize fixed discount to monthly
                    let monthlyDiscount = coupon.amount_off;
                    const interval = (sub as any).plan?.interval || 'month';
                    if (interval === 'year') monthlyDiscount /= 12;
                    subscriptionMrrCents = Math.max(0, subscriptionMrrCents - monthlyDiscount);
                } else if (coupon.percent_off) {
                    subscriptionMrrCents = subscriptionMrrCents * (1 - (coupon.percent_off / 100));
                }
            }

            if (isTrial) {
                potentialMrrFromTrialsCents += subscriptionMrrCents;
            } else {
                totalMrrCents += subscriptionMrrCents;
            }
        }



        // 2. Fetch net revenue for the last 30 days
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        let netRevenue30dCents = 0;

        for await (const payment of stripe.paymentIntents.list({
            created: { gte: thirtyDaysAgo },
        })) {
            if (payment.status === 'succeeded') {
                netRevenue30dCents += (payment.amount_received || payment.amount || 0);
            }
        }

        // 3. Fetch cancellations for the last 30 days to calculate churn
        const cancellations = await stripe.subscriptions.list({
            status: 'canceled',
            created: { gte: thirtyDaysAgo },
            limit: 100
        });

        const churnRate = activeSubsCount > 0 
            ? (cancellations.data.length / (activeSubsCount + cancellations.data.length)) 
            : 0;

        return {
            success: true,
            mrr: totalMrrCents / 100,
            arr: (totalMrrCents * 12) / 100,
            activeSubs: activeSubsCount,
            trialSubs: trialSubsCount,
            potentialMrrFromTrials: potentialMrrFromTrialsCents / 100,
            counts,
            netRevenue30d: netRevenue30dCents / 100,
            churnRate: Math.max(0.012, churnRate), // Default to 1.2% if no data to avoid division by zero or unrealistic 0%
            arpu: activeSubsCount > 0 ? (totalMrrCents / 100) / activeSubsCount : 0,
            currency: 'DKK'
        };

    } catch (error: any) {
        console.error("Stripe Dashboard Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getStripeHistoricalRevenueAction() {
    if (!isStripeConfigured) {
        return { success: false, error: "Stripe er ikke konfigureret." };
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const twelveMonthsAgo = now - (365 * 24 * 60 * 60);

        const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        const revenueByMonth: Record<string, number> = {};

        // Fetch paid invoices for the last 12 months using auto-pagination
        for await (const inv of stripe.invoices.list({
            created: { gte: twelveMonthsAgo },
            status: 'paid',
        })) {
            const date = new Date(inv.created * 1000);
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();
            const label = `${monthName} ${year}`;
            
            revenueByMonth[label] = (revenueByMonth[label] || 0) + (inv.amount_paid / 100);
        }


        // Convert the map to a sorted array for charts
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        // Generate last 12 months slots to ensure zero-filled months
        const result: any[] = [];
        for (let i = 11; i >= 0; i--) {

            const d = new Date(currentYear, currentMonth - i, 1);
            const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
            result.push({
                name: label,
                revenue: Math.round(revenueByMonth[label] || 0),
                _timestamp: d.getTime()
            });
        }

        return { success: true, data: result };
    } catch (error: any) {
        console.error("Stripe Historical Revenue Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Security: Logs user session metadata for fraud and sharing detection.
 * Part of the "AI Fraud & Sharing Detection" system.
 */
export async function logUserSessionAction(userId: string, userName: string) {
    if (!userId || !adminFirestore) return { success: false };

    try {
        const headerList = await headers();
        const ip = headerList.get('x-forwarded-for') || 'unknown';
        const userAgent = headerList.get('user-agent') || 'unknown';
        
        // Simple rate limiting: Only log once every 30 minutes to reduce DB load
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const recentLogs = await adminFirestore.collection('userSessions')
            .where('userId', '==', userId)
            .where('createdAt', '>=', thirtyMinsAgo)
            .limit(1)
            .get();

        if (recentLogs.empty) {
            await adminFirestore.collection('userSessions').add({
                userId,
                userName,
                ip,
                userAgent,
                createdAt: FieldValue.serverTimestamp()
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to log user session:", error);
        return { success: false };
    }
}

/**
 * AI Security: Detects users with high risk of account sharing.
 * Flags users with > 3 unique IPs in the last 7 days.
 */
export async function detectAccountSharingAction() {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const logs = await adminFirestore.collection('userSessions')
            .where('createdAt', '>=', sevenDaysAgo)
            .get();

        const userRisks: Record<string, { userId: string, userName: string, ips: Set<string>, agents: Set<string> }> = {};

        logs.forEach(doc => {
            const data = doc.data();
            if (!userRisks[data.userId]) {
                userRisks[data.userId] = { userId: data.userId, userName: data.userName, ips: new Set(), agents: new Set() };
            }
            userRisks[data.userId].ips.add(data.ip);
            userRisks[data.userId].agents.add(data.userAgent);
        });

        const flaggedUsers = Object.values(userRisks)
            .filter(u => u.ips.size > 2 || u.agents.size > 3) // Sharper threshold
            .map(u => ({
                userId: u.userId,
                userName: u.userName,
                uniqueIps: u.ips.size,
                uniqueDevices: u.agents.size,
                riskLevel: u.ips.size > 4 ? 'critical' : 'high'
            }))
            .sort((a, b) => b.uniqueIps - a.uniqueIps);

        return { success: true, data: flaggedUsers };
    } catch (error) {
        console.error("Failed to detect account sharing:", error);
        return { success: false, error: "Security scan felet." };
    }
}

/**
 * Engagement: Management of Gamification Challenges.
 */
export async function createGamificationEventAction(input: {
    title: string;
    description: string;
    type: 'quiz_count' | 'streak_days';
    startDate: string;
    endDate: string;
    reward: string;
}) {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('gamificationEvents').add({
            ...input,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            isActive: true,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to create gamification event:", e);
        return { success: false };
    }
}

export async function getGamificationEventsAction() {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('gamificationEvents')
            .orderBy('createdAt', 'desc')
            .get();
        
        const events = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate.toDate().toISOString(),
            endDate: doc.data().endDate.toDate().toISOString()
        }));
        
        return { success: true, data: events };
    } catch (e) {
        console.error("Failed to get gamification events:", e);
        return { success: false };
    }
}

export async function deleteGamificationEventAction(eventId: string) {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('gamificationEvents').doc(eventId).delete();
        return { success: true };
    } catch (e) {
        console.error("Failed to delete gamification event:", e);
        return { success: false };
    }
}

export async function getEventLeaderboardAction(eventId: string) {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('gamificationEvents')
            .doc(eventId)
            .collection('userProgress')
            .orderBy('score', 'desc')
            .limit(20)
            .get();
        
        const leaderboard = snap.docs.map(doc => ({
            ...doc.data(),
            lastUpdate: doc.data().lastUpdate?.toDate()?.toISOString() || null
        }));
        return { success: true, data: leaderboard };
    } catch (e) {
        console.error("Failed to get leaderboard:", e);
        return { success: false };
    }
}

/**
 * Legal & Compliance: GDPR and Audit readiness.
 */
export async function getComplianceLogsAction() {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        
        const logs = snap.docs.map(doc => {
            const data = doc.data();
            return {
                userId: doc.id,
                userName: data.username || 'Kollega',
                email: data.email,
                acceptedAt: (data.acceptedTermsAt?.toDate ? data.acceptedTermsAt.toDate() : (data.acceptedTermsAt ? new Date(data.acceptedTermsAt) : data.createdAt?.toDate?.() || null))?.toISOString() || null,
                termsVersion: data.acceptedTermsVersion || 'v1.0.0'
            };
        });
        
        return { success: true, data: logs };
    } catch (e) {
        console.error("Failed to get compliance logs:", e);
        return { success: false };
    }
}

export async function exportUserGDPRDataAction(userIdOrEmail: string) {
    if (!adminFirestore) return { success: false };
    try {
        let userSnap;
        if (userIdOrEmail.includes('@')) {
            userSnap = await adminFirestore.collection('users').where('email', '==', userIdOrEmail.toLowerCase()).get();
        } else {
            const doc = await adminFirestore.collection('users').doc(userIdOrEmail).get();
            if (doc.exists) userSnap = { docs: [doc], empty: false };
            else userSnap = { empty: true };
        }

        if (userSnap.empty) return { success: false, message: 'User not found' };
        
        const userDoc = userSnap.docs[0];
        const userId = userDoc.id;
        const profile = userDoc.data();

        // Gather subcollections
        const quizSnap = await adminFirestore.collection('users').doc(userId).collection('quizResults').get();
        const quizResults = quizSnap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate()?.toISOString() || null }));
        
        const sessionSnap = await adminFirestore.collection('userSessions').where('userId', '==', userId).get();
        const sessions = sessionSnap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate()?.toISOString() || null }));
        
        const notifSnap = await adminFirestore.collection('users').doc(userId).collection('notifications').get();
        const notifications = notifSnap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate()?.toISOString() || null }));

        const fullDump = {
            metadata: {
                exportedAt: new Date().toISOString(),
                userId,
                email: profile.email || 'N/A'
            },
            profile: JSON.parse(JSON.stringify(profile)), // Clean up Timestamps etc
            usageHistory: {
                quizResults: JSON.parse(JSON.stringify(quizResults)),
                sessions: JSON.parse(JSON.stringify(sessions)),
                notifications: JSON.parse(JSON.stringify(notifications))
            }
        };

        return { success: true, data: fullDump };
    } catch (e: any) {
        console.error("GDPR Export failed:", e);
        return { success: false, message: e.message || 'Export failed' };
    }
}

/**
 * Policy Management: Manage Terms, Privacy & Cookies.
 */
export type PolicyType = 'terms' | 'privacy' | 'cookies';

export async function getPolicyAction(type: PolicyType) {
    if (!adminFirestore) return { success: false };
    try {
        const docRef = adminFirestore.collection('globalConfigs').doc(type);
        const snap = await docRef.get();
        
        if (!snap.exists) {
            const defaults = {
                terms: "Standard Handelsbetingelser...",
                privacy: "Privatlivspolitik...",
                cookies: "Cookiepolitik..."
            };
            return { 
                success: true, 
                data: { 
                    content: defaults[type] || "Ny Politik...", 
                    version: "1.0.0",
                    updatedAt: new Date().toISOString()
                } 
            };
        }
        
        const data = snap.data() || {};
        return { 
            success: true, 
            data: {
                ...data,
                createdAt: (data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null))?.toISOString() || null,
                updatedAt: (data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()))?.toISOString()
            }
        };
    } catch (e) {
        console.error(`Failed to get policy ${type}:`, e);
        return { success: false };
    }
}

export async function updatePolicyAction(type: PolicyType, content: string) {
    if (!adminFirestore) return { success: false };
    try {
        const docRef = adminFirestore.collection('globalConfigs').doc(type);
        const snap = await docRef.get();
        
        let newVersion = "1.0.1";
        if (snap.exists) {
            const currentVersion = snap.data()?.version || "1.0.0";
            const parts = currentVersion.split('.').map(Number);
            parts[2] = (parts[2] || 0) + 1; // Increment patch
            newVersion = parts.join('.');
        }

        const updateData = {
            content,
            version: newVersion,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: 'admin'
        };

        await docRef.set(updateData, { merge: true });

        // Log the change in audit history
        await adminFirestore.collection('globalConfigs').doc(type).collection('history').add({
            ...updateData,
            updatedAt: FieldValue.serverTimestamp() // Log real server time
        });

        return { success: true, version: newVersion };
    } catch (e) {
        console.error(`Failed to update policy ${type}:`, e);
        return { success: false };
    }
}

export async function getPolicyHistoryAction(type: PolicyType) {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('globalConfigs').doc(type)
            .collection('history')
            .orderBy('updatedAt', 'desc')
            .limit(50)
            .get();
        
        const history = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null
        }));
        
        return { success: true, data: history };
    } catch (e) {
        console.error(`Failed to fetch history for ${type}:`, e);
        return { success: false };
    }
}

export async function acceptLatestTermsAction(userId: string) {
    if (!adminFirestore) return { success: false };
    try {
        const termsSnap = await adminFirestore.collection('globalConfigs').doc('terms').get();
        if (!termsSnap.exists) return { success: false, message: 'Terms document not found' };
        
        const latestVersion = termsSnap.data()?.version || '1.0.0';
        
        await adminFirestore.collection('users').doc(userId).update({
            acceptedTermsVersion: latestVersion,
            acceptedTermsAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        
        return { success: true, version: latestVersion };
    } catch (e: any) {
        console.error("Failed to accept latest terms:", e);
        return { success: false, message: e.message };
    }
}

// Aliases for compatibility
export async function getTermsConfigAction() { return getPolicyAction('terms'); }
export async function updateTermsConfigAction(content: string) { return updatePolicyAction('terms', content); }




export async function optimizeSeoAction(input: Types.OptimizeSeoInput): Promise<Types.OptimizeSeoOutput> {
    return callFirebaseFlow('optimizeSeoFlow', input);
}

export async function generateLawFlowchartAction(input: { lovTitel: string, paragrafNummer: string, paragrafTekst: string, fuldLovtekst?: string }): Promise<Types.GenerateLawFlowchartOutput> {
    const cacheKey = `${input.lovTitel}_${input.paragrafNummer}`.replace(/[\/\s#§]/g, '_').toLowerCase();
    
    try {
        const cacheRef = adminFirestore.collection('lawFlowcharts').doc(cacheKey);
        const cacheDoc = await cacheRef.get();
        
        if (cacheDoc.exists) {
            const cachedData = cacheDoc.data();
            if (cachedData?.data) {
                 return { 
                    data: cachedData.data, 
                    usage: { inputTokens: 0, outputTokens: 0 } 
                 };
            }
        }
        
        const result = await callFirebaseFlow('generateLawFlowchartFlow', input);
        
        // Cache the result asynchronously (don't block the UI)
        cacheRef.set({
            data: result.data,
            lovTitel: input.lovTitel,
            paragrafNummer: input.paragrafNummer,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("Flowchart caching failed:", err));
        
        return result;
    } catch (e: any) {
        console.error("generateLawFlowchartAction failed:", e);
        return callFirebaseFlow('generateLawFlowchartFlow', input);
    }
}

export async function addSecondOpinionDecisionAction(decision: { title: string, content?: string, pdfBase64?: string, outcome: 'justified' | 'unsupported', tags?: string[] }) {
    if (!adminFirestore) return { success: false };
    try {
        // AI Analysis call
        let aiAnalysis = { weightingFactors: [] as any[], criticalPoint: "Analyseres..." };
        try {
            const flowInput = decision.pdfBase64 
                ? { title: decision.title, pdfBase64: decision.pdfBase64 }
                : { content: decision.content };
            
            const flowName = decision.pdfBase64 ? 'analyzeLegalDecisionPdfFlow' : 'analyzeLegalDecisionFlow';
            
            const analysisResult = await callFirebaseFlow(flowName, flowInput);
            if (analysisResult.success) {
                // Map the output fields to our internal format
                const raw = analysisResult.data;
                aiAnalysis = {
                    weightingFactors: [raw.hvadErAfgørelsen].filter(Boolean) as any[],
                    criticalPoint: raw.påBaggrundAfHvad || "Ingen specifik begrundelse udtrukket."
                };
            }
        } catch (aiError) {
            console.error("AI Analysis flow failed, falling back to basic data:", aiError);
        }
        
        const decisionData = {
            ...decision,
            aiAnalysis,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        // Remove the heavy base64 before saving to Firestore to keep doc sizes small
        if (decisionData.pdfBase64) {
            delete decisionData.pdfBase64;
            // Optionally save the file content to a 'content' field if AI returned a summary
            if (!decisionData.content && aiAnalysis.criticalPoint) {
                decisionData.content = `${aiAnalysis.weightingFactors.join('\n')}\n\n${aiAnalysis.criticalPoint}`;
            }
        }
        
        const docRef = await adminFirestore.collection('secondOpinionDecisions').add(decisionData);
        
        // After adding, we trigger a refresh of the global error summary
        await generateSecondOpinionErrorSummaryAction();

        return { success: true, id: docRef.id };
    } catch (e: any) {
        console.error("Failed to add decision:", e);
        return { success: false, message: e.message };
    }
}

export async function deleteSecondOpinionDecisionAction(id: string) {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('secondOpinionDecisions').doc(id).delete();
        await generateSecondOpinionErrorSummaryAction(); // Refresh summary
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete decision:", e);
        return { success: false, message: e.message };
    }
}

export async function getSecondOpinionDecisionsAction() {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('secondOpinionDecisions').orderBy('createdAt', 'desc').get();
        const docs = snap.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data, 
                createdAt: (data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()))?.toISOString(),
                updatedAt: (data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()))?.toISOString()
            };
        });
        return { success: true, data: docs };
    } catch (e: any) {
        console.error("Failed to fetch decisions:", e);
        return { success: false };
    }
}

export async function generateSecondOpinionErrorSummaryAction() {
    if (!adminFirestore) return { success: false };
    try {
        // Fetch all decisions
        const snap = await adminFirestore.collection('secondOpinionDecisions').get();
        const decisions = snap.docs.map(d => d.data());
        
        if (decisions.length === 0) return { success: true };

        // Call AI to summarize frequent errors leading to student wins
        const winDecisions = decisions.filter(d => d.outcome === 'justified');
        let summary = "Der er endnu ikke genereret et AI-overblik. Tilføj flere afgørelser for at se mønstre her.";
        
        try {
            const summaryResult = await callFirebaseFlow('summarizeSecondOpinionErrorsFlow', { winDecisions });
            if (summaryResult.success) {
                summary = summaryResult.data;
            }
        } catch (aiError) {
            console.warn("Summary AI flow failed:", aiError);
        }
        
        await adminFirestore.collection('systemSettings').doc('secondOpinionSummary').set({
            summary,
            updatedAt: FieldValue.serverTimestamp(),
            decisionCount: decisions.length,
            winCount: winDecisions.length
        });

        return { success: true };
    } catch (e: any) {
        console.error("Failed to generate error summary:", e);
        return { success: false };
    }
}

export async function getSecondOpinionErrorSummaryAction() {
    if (!adminFirestore) return { success: false };
    try {
        const doc = await adminFirestore.collection('systemSettings').doc('secondOpinionSummary').get();
        if (!doc.exists) return { success: false };
        
        const data = doc.data();
        if (data) {
            return { 
                success: true, 
                data: {
                    ...data,
                    updatedAt: (data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()))?.toISOString()
                } 
            };
        }
        return { success: false };
    } catch (e: any) {
        console.error("Failed to get error summary:", e);
        return { success: false };
    }
}

export async function getFeatureRequestsAction() {
    if (!adminFirestore) return { success: false };
    try {
        const snap = await adminFirestore.collection('featureRequests')
            .orderBy('votes', 'desc')
            .limit(50)
            .get();
            
        const requests = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title || '',
                description: data.description || '',
                votes: data.votes || 0,
                status: data.status || 'suggested',
                authorName: data.authorName || 'Anonym Kollega',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });
        
        return { success: true, data: requests };
    } catch (e: any) {
        console.error("Failed to fetch feature requests:", e);
        return { success: false, message: e.message };
    }
}

export async function submitFeatureRequestAction(input: { title: string, description: string, authorName?: string, userId?: string }) {
    if (!adminFirestore) return { success: false };
    try {
        const res = await adminFirestore.collection('featureRequests').add({
            title: input.title,
            description: input.description,
            authorName: input.authorName || 'Anonym Kollega',
            authorId: input.userId || null,
            votes: 1,
            status: 'suggested',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, id: res.id };
    } catch (e: any) {
        console.error("Failed to submit feature request:", e);
        return { success: false, message: e.message };
    }
}

export async function voteForFeatureAction(requestId: string) {
    if (!adminFirestore) return { success: false };
    try {
        const ref = adminFirestore.collection('featureRequests').doc(requestId);
        await ref.update({
            votes: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to vote for feature:", e);
        return { success: false, message: e.message };
    }
}

export async function updateFeatureRequestStatusAction(requestId: string, status: 'suggested' | 'planned' | 'in-progress' | 'completed') {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('featureRequests').doc(requestId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to update feature request status:", e);
        return { success: false, message: e.message };
    }
}

export async function deleteFeatureRequestAction(requestId: string) {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('featureRequests').doc(requestId).delete();
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete feature request:", e);
        return { success: false, message: e.message };
    }
}

export async function generateAIFeatureRequestsAction() {
    if (!adminFirestore) return { success: false };
    
    // Some realistic ideas for a social worker platform
    const ideas = [
        { title: "Mobil app med offline adgang", description: "Mulighed for at læse lovparagraffer og egne noter i toget uden internetforbindelse." },
        { title: "AI-coach til borger-samtaler", description: "Træn svære samtaler med en AI-repræsentant for en vildledt eller vred borger før praksis." },
        { title: "Skabeloner til VUM-udredninger", description: "Standardiserede skabeloner der gør det lettere at strukturere sine første udredninger." },
        { title: "Eksamens-simulator til Jura", description: "Simulerede eksamensspørgsmål baseret på tidligere års opgaver og gældende retspraksis." },
        { title: "Praktik-matching algoritme", description: "Find det perfekte praktiksted baseret på dine faglige interesser og tidligere studerendes anmeldelser." },
        { title: "Studiegruppe-finder", description: "Find medstuderende på dit eget semester der gerne vil læse sammen i de svære moduler." },
        { title: "Podcast: 'Fra teori til virkelighed'", description: "Ugentlige afsnit hvor færdiguddannede socialrådgivere fortæller om deres første år i marken." },
        { title: "Notat-samarbejde", description: "Mulighed for at dele og redigere noter live med sin studiegruppe direkte i Cohéro." },
        { title: "Mental sundhed for studerende", description: "Et lukket forum med fokus på de psykiske belastninger der kan opstå i socialt arbejde." },
        { title: "Lovgivnings-overblik (Tidslinje)", description: "Se hvordan Barnets Lov har ændret sig over tid med en interaktiv tidslinje." },
        { title: "Karriere-vejviser", description: "Oversigt over specialiseringsmuligheder efter uddannelsen med lønstatistik og jobbeskrivelser." },
        { title: "Interaktivt ICS-kort", description: "Visualisering af barnets behov jf. ICS-modellen med direkte links til relevante paragraffer." }
    ];

    try {
        const batch = adminFirestore.batch();
        const now = admin.firestore.FieldValue.serverTimestamp();
        
        // Pick 6 random unique ideas
        const shuffled = [...ideas].sort(() => 0.5 - Math.random()).slice(0, 6);
        
        shuffled.forEach(idea => {
            const ref = adminFirestore.collection('featureRequests').doc();
            batch.set(ref, {
                ...idea,
                votes: Math.floor(Math.random() * 25) + 5, // 5 to 30 votes
                status: 'suggested',
                authorName: 'AI Kollega',
                createdAt: now,
                updatedAt: now
            });
        });

        await batch.commit();
        return { success: true };
    } catch (e: any) {
        console.error("Failed to generate AI requests:", e);
        return { success: false, message: e.message };
    }
}

export async function saveCurriculumAction(curriculum: any) {
    if (!adminFirestore) return { success: false };
    try {
        const { id, ...data } = curriculum;
        const now = admin.firestore.FieldValue.serverTimestamp();
        
        // Ensure all modules have an ID if they don't have one
        if (data.modules) {
           data.modules = data.modules.map((m: any, idx: number) => ({
               ...m,
               id: m.id || `modul-${idx + 1}`
           }));
        }

        const finalData = {
            ...data,
            updatedAt: now
        };
        
        if (!id) {
            finalData.createdAt = now;
            const res = await adminFirestore.collection('curriculums').add(finalData);
            return { success: true, id: res.id };
        } else {
            await adminFirestore.collection('curriculums').doc(id).set(finalData, { merge: true });
            return { success: true, id };
        }
    } catch (e: any) {
        console.error("Failed to save curriculum:", e);
        return { success: false, message: e.message };
    }
}

export async function deleteCurriculumAction(id: string) {
    if (!adminFirestore) return { success: false };
    try {
        await adminFirestore.collection('curriculums').doc(id).delete();
        return { success: true };
    } catch (e: any) {
        console.error("Failed to delete curriculum:", e);
        return { success: false, message: e.message };
    }
}




export async function translateDiagnoseAction(input: { text: string, context?: string }) {
    return await callFirebaseFlow('translateDiagnoseFlow', input);
}

export async function getDiagnoseDetailsAction(input: { id: string }) {
    return await callFirebaseFlow('getDiagnoseDetailsFlow', input);
}
export async function analyzeAdminDocumentAction(input: any) { return callFirebaseFlow('analyzeAdminDocumentFlow', input); }

export async function chatWithGuidelineContentAction(input: Types.GuidelineChatInput): Promise<Types.GuidelineChatOutput> {
    return callFirebaseFlow('chatWithGuidelineContentFlow', input);
}

/**
 * sendProofreadingQuoteRequestAction:
 * Sends an email to seb@cohero.dk via Resend when a user requests a proofreading quote.
 */
export async function sendProofreadingQuoteRequestAction(input: { 
    name: string, 
    email: string, 
    charCount: number, 
    estimatedPrice: number, 
    deadline: string,
    message?: string 
}) {
    const { isResendConfigured, resend } = await import('@/lib/resend');
    
    if (!isResendConfigured) {
        console.error("Resend is not configured.");
        return { success: false, message: "Email-serveren er ikke klar. Kontakt os direkte på kontakt@cohero.dk" };
    }

    try {
        const { name, email, charCount, estimatedPrice, deadline, message } = input;
        
        // Save to Firestore for administration
        try {
            const { adminFirestore } = await import('@/firebase/server-init');
            const { FieldValue } = await import('firebase-admin/firestore');
            await adminFirestore.collection('proofreadingRequests').add({
                name,
                email,
                charCount,
                estimatedPrice,
                deadline,
                message: message || "",
                status: 'pending', // pending, contact_made, completed, rejected
                createdAt: FieldValue.serverTimestamp(),
            });
        } catch (fsError) {
            console.error("Failed to save proofreading request to Firestore:", fsError);
            // We continue anyway so the email is still sent even if logging fails
        }

        await resend.emails.send({
            from: 'Cohéro Korrektur <info@platform.cohero.dk>',
            to: 'seb@cohero.dk',
            reply_to: email,
            subject: `Korrektur-forespørgsel: ${name} (${charCount.toLocaleString()} tegn)`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #451a03; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Ny Tilbudsanmodning</h1>
                    <div style="background-color: #fffbeb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <p><strong>Kunde:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Antal tegn:</strong> ${charCount.toLocaleString()}</p>
                        <p><strong>Anslået pris:</strong> ${estimatedPrice} kr.</p>
                        <p><strong>Ønsket deadline:</strong> ${deadline}</p>
                    </div>
                    <p><strong>Besked:</strong></p>
                    <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic;">${message || "Ingen besked."}</p>
                </div>
            `,
        });

        // Confirmation to user
        await resend.emails.send({
            from: 'Cohéro <info@platform.cohero.dk>',
            to: email,
            subject: 'Vi har modtaget din forespørgsel om korrektur',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #451a03; font-size: 24px; font-weight: 800; margin-bottom: 24px;">Tak for din forespørgsel!</h1>
                    <p>Vi har modtaget din anmodning om korrekturlæsning på <strong>${charCount.toLocaleString()} tegn</strong> med ønsket deadline d. <strong>${deadline}</strong>.</p>
                    <p>Vi kigger på den nu og vender tilbage med en tidsplan hurtigst muligt.</p>
                    <p>Med venlig hilsen,<br/>Team Cohéro</p>
                </div>
            `,
        });

        return { success: true, message: "Din forespørgsel er sendt! Vi vender tilbage hurtigst muligt." };
    } catch (error: any) {
        console.error("Failed to send quote request email:", error);
        return { success: false, message: "Der skete en fejl. Prøv venligst igen senere." };
    }
}

/**
 * updateProofreadingRequestStatusAction:
 * Updates the administrative status of a proofreading request in Firestore.
 */
export async function updateProofreadingRequestStatusAction(requestId: string, newStatus: 'pending' | 'contacted' | 'completed' | 'rejected') {
    try {
        const { adminFirestore } = await import('@/firebase/server-init');
        await adminFirestore.collection('proofreadingRequests').doc(requestId).update({
            status: newStatus
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false };
    }
}

/**
 * sendKorrekturPaymentLinkAction:
 * Creates a Stripe Payment Link for a specific proofreading order and
 * sends it to the customer via email.
 */
export async function sendKorrekturPaymentLinkAction(input: {
    requestId: string;
    customerName: string;
    customerEmail: string;
    amountDkk: number;
    description?: string;
}): Promise<{ success: boolean; message: string; paymentUrl?: string }> {
    try {
        const { stripe } = await import('@/lib/stripe');
        const { adminFirestore } = await import('@/firebase/server-init');
        const { wrapEmailHtml } = await import('@/lib/email-helper');

        // Create a Stripe Price on the fly (one-time)
        const price = await stripe.prices.create({
            currency: 'dkk',
            unit_amount: Math.round(input.amountDkk * 100), // øre
            product_data: {
                name: `Korrekturlæsning – ${input.description || 'Académisk opgave'}`,
            },
        });

        // Create a Payment Link
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            after_completion: {
                type: 'redirect',
                redirect: { url: 'https://student.cohero.dk/korrektur?betalt=1' },
            },
            metadata: {
                requestId: input.requestId,
                type: 'korrektur',
            },
        });

        const paymentUrl = paymentLink.url;

        // Send email to customer
        const html = wrapEmailHtml(`
            <h1 style="color: #451a03; font-size: 24px; margin-bottom: 20px; font-family: serif;">Dit betalingslink er klar</h1>
            <p>Hej ${input.customerName},</p>
            <p>Tak for din forespørgsel på korrekturlæsning. Vi har gennemgået dit materiale og er klar til at gå i gang, så snart betalingen er modtaget.</p>
            <p><strong>Beløb: ${input.amountDkk} kr.</strong></p>
            <p>Klik på knappen herunder for at gennemføre betalingen sikkert via Stripe:</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${paymentUrl}" style="background-color: #451a03; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">Betal ${input.amountDkk} kr.</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Når betalingen er gennemført, går vi i gang med din korrekturlæsning og sender resultatet til dig inden din deadline. Betalingen håndteres sikkert af Stripe.</p>
            <p style="font-size: 11px; color: #94a3b8; word-break: break-all; margin-top: 20px;">Virker knappen ikke? Kopiér dette link: ${paymentUrl}</p>
        `);

        const emailResult = await sendResendEmailRaw({
            from: 'Cohéro Korrektur <info@platform.cohero.dk>',
            to: input.customerEmail,
            subject: `Betalingslink til din korrekturlæsning – ${input.amountDkk} kr.`,
            html,
        });

        if (!emailResult.ok) {
            console.error('Resend error:', emailResult);
            return { success: false, message: 'Betalingslink oprettet, men e-mail kunne ikke sendes.' };
        }

        // Save payment link URL to Firestore
        await adminFirestore.collection('proofreadingRequests').doc(input.requestId).update({
            paymentUrl,
            paymentLinkSentAt: new Date(),
            status: 'contacted',
        });

        console.log(`Korrektur payment link sent to ${input.customerEmail}: ${paymentUrl}`);
        return { success: true, message: 'Betalingslink sendt til kunden.', paymentUrl };
    } catch (error: any) {
        console.error('sendKorrekturPaymentLinkAction error:', error);
        return { success: false, message: error.message || 'Der opstod en fejl.' };
    }
}



export async function generateCourseAction(input: Types.GenerateCourseInput): Promise<Types.GenerateCourseOutput> {
    return callFirebaseFlow('generateCourseFlow', input);
}


export async function citizenSimulationAction(input: Types.CitizenSimulationInput): Promise<Types.CitizenSimulationOutput> {
    return callFirebaseFlow('citizenSimulationFlow', input);
}

export async function generateLearningObjectivesAction(input: Types.GenerateLearningObjectivesInput): Promise<Types.GenerateLearningObjectivesOutput> {
    return callFirebaseFlow('generateLearningObjectivesFlow', input);
}

export async function getAIUsageMetricsAction() {
    try {
        const { adminFirestore } = await import('@/firebase/server-init');
        const doc = await adminFirestore.collection('stats').doc('ai_usage').get();
        const data = doc.exists ? doc.data() : { totalInputTokens: 0, totalOutputTokens: 0 };
        
        // Mock history for the dashboard chart
        const history = [
            { name: 'Man', usage: 45000 },
            { name: 'Tir', usage: 52000 },
            { name: 'Ons', usage: 48000 },
            { name: 'Tor', usage: 61000 },
            { name: 'Fre', usage: 55000 },
            { name: 'Lør', usage: 32000 },
            { name: 'Søn', usage: 28000 },
        ];

        return { 
            success: true, 
            data: {
                totalInputTokens: data?.totalInputTokens || 0,
                totalOutputTokens: data?.totalOutputTokens || 0,
                // Add other numeric/string fields explicitly if they exist
            },
            history
        };
    } catch (error) {
        console.error("Failed to fetch AI usage metrics:", error);
        return { success: false, history: [] };
    }
}

/**
 * Journal Trainer V2 Actions
 */

export async function generateJournalScenarioAction(input: { topic?: string, profession?: string }) {
    return callFirebaseFlow('generateJournalScenarioFlow', input);
}

export async function evaluateJournalEntryAction(input: { scenario: any, journalContent: string, profession?: string }) {
    return callFirebaseFlow('evaluateJournalEntryFlow', input);
}

export async function saveMindmapAction(input: {
    userId: string,
    semesterId: string,
    title: string,
    data: any
}) {
    const { adminFirestore } = await import('@/firebase/server-init');
    try {
        const docRef = await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('userMindmaps')
            .add({
                semesterId: input.semesterId,
                title: input.title,
                data: input.data,
                createdAt: new Date().toISOString()
            });
        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Error saving mindmap:", error);
        return { success: false, error: error.message };
    }
}

export async function getMindmapsAction(userId: string, semesterId: string) {
    const { adminFirestore } = await import('@/firebase/server-init');
    try {
        const snapshot = await adminFirestore.collection('users')
            .doc(userId)
            .collection('userMindmaps')
            .where('semesterId', '==', semesterId)
            .get();
        
        const mindmaps = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return { success: true, mindmaps };
    } catch (error: any) {
        console.error("Error fetching mindmaps:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMindmapAction(userId: string, mindmapId: string) {
    const { adminFirestore } = await import('@/firebase/server-init');
    try {
        await adminFirestore.collection('users')
            .doc(userId)
            .collection('userMindmaps')
            .doc(mindmapId)
            .delete();
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting mindmap:", error);
        return { success: false, error: error.message };
    }
}

export async function getMindmapNodeSourceAction(input: {
    userId: string,
    semesterId: string,
    nodeText: string
}) {
    const { adminFirestore } = await import('@/firebase/server-init');
    try {
        // Fetch chunks for this semester
        const materialsSnapshot = await adminFirestore.collection('users')
            .doc(input.userId)
            .collection('materials')
            .where('semester', '==', input.semesterId)
            .get();
        
        const materialIds = materialsSnapshot.docs.map(doc => doc.id);
        if (materialIds.length === 0) return { success: true, sources: [], sourceText: "Ingen materialer fundet." };

        // Search across ALL materials for this semester - Firestore 'in' limit is 10
        let allChunks: any[] = [];
        for (let i = 0; i < materialIds.length; i += 10) {
            const batchIds = materialIds.slice(i, i + 10);
            const chunksSnapshot = await adminFirestore.collection('users')
                .doc(input.userId)
                .collection('materialChunks')
                .where('materialId', 'in', batchIds)
                .limit(500)
                .get();
            
            allChunks.push(...chunksSnapshot.docs.map(doc => ({
                text: doc.data().text || "",
                materialId: doc.data().materialId
            })));
        }
        
        const chunks = allChunks;
        
        const keywords = input.nodeText.toLowerCase().split(' ').filter(w => w.length > 3);
        const seenMaterialIds = new Set<string>();

        // Sort chunks by relevance and quality
        const scoredChunks = chunks.map(chunk => {
            const text = chunk.text;
            const materialId = chunk.materialId;
            let score = 0;
            
            // Check for keywords
            for (const kw of keywords) {
                if (text.toLowerCase().includes(kw)) score += 2;
            }

            // Quality Penalties: Ignore TOCs, colophons and metadata
            const lowerText = text.toLowerCase();
            const isTOC = lowerText.includes('.......') || lowerText.includes('indholdsfortegnelse') || (lowerText.match(/[0-9]{1,3}$/gm) || []).length > 5;
            const isMetadata = lowerText.includes('isbn') || lowerText.includes('doi:') || lowerText.includes('copyright') || lowerText.includes('forlag') || lowerText.includes('alle rettigheder');
            
            if (isTOC) score -= 15;
            if (isMetadata) score -= 12;
            
            // Benefit longer, paragraph-like chunks that look like real content
            if (text.length > 400 && !isMetadata) score += 2;

            return { text, materialId, score };
        }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

        // Take top 3 unique materials and process in parallel
        const sourcePromises = [];
        const uniqueMaterials: any[] = [];
        for (const chunkObj of scoredChunks) {
            if (uniqueMaterials.length >= 3) break;
            if (seenMaterialIds.has(chunkObj.materialId)) continue;
            seenMaterialIds.add(chunkObj.materialId);
            uniqueMaterials.push(chunkObj);
        }

        const sourceResults = await Promise.all(uniqueMaterials.map(async (chunkObj) => {
            let citation = "Kilde ukendt";
            let formattedSource = chunkObj.text;

            const matDoc = await adminFirestore.collection('users')
                .doc(input.userId)
                .collection('materials')
                .doc(chunkObj.materialId)
                .get();
            
            if (matDoc.exists) {
                const data = matDoc.data();
                citation = data?.title || data?.name || data?.fileName || "Uden titel";

                try {
                    const formatPrompt = `Du er en redaktør. Din opgave er at uddrage det mest relevante ANALYTISKE AFSNIT om emnet "${input.nodeText}" fra nedenstående rå tekst. 
                    
                    VIGTIGE KRAV:
                    1. FIND INDHOLDET: Du skal finde den faktiske forklaring eller analyse af emnet. IGNORER bibliografisk data (forlag, ISBN, DOI, copyright-sider, indholdsfortegnelser).
                    2. SAMMENFLET linjer der er knækket midt i en sætning. Teksten SKAL fremstå som sammenhængende afsnit.
                    3. FJERN STØJ: Sidetal, sidehoveder og scanning-fejl skal fjernes helt.
                    4. FORMATERING: Teksten skal stå som et sammenhængende, letlæseligt afsnit.
                    5. STRUKTUR: Tilføj en 'type' (f.eks. 'teori', 'case', 'definition') til hvert logisk underafsnit.
                    
                    RÅ TEKST FRA DOKUMENT:
                    ${chunkObj.text}`;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per call

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getGeminiApiKey()}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: formatPrompt }] }],
                            generationConfig: { 
                                temperature: 0.2, 
                                maxOutputTokens: 8192,
                                response_mime_type: "application/json"
                            }
                        }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const resData = await response.json();
                        const result = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (result) formattedSource = result;
                    }
                } catch (err) {
                    console.error("Gemini excerpt failed or timed out", err);
                }
            }
            return { text: formattedSource, citation };
        }));

        return { 
            success: true, 
            sources: sourceResults.length > 0 ? sourceResults : [{ text: "Ingen præcise kilder fundet.", citation: "Kilde ukendt" }]
        };
    } catch (error: any) {
        console.error("Error fetching node source:", error);
        return { success: false, error: error.message };
    }
}

/**
 * processBookTocAction: Extracts book structure from images using Gemini Vision.
 */
export async function processBookTocAction(input: { images: string[] }) {
    try {
        const geminiKey = getGeminiApiKey();
        const prompt = `Du er en ekspert i at digitalisere bøger. Her er billeder af en indholdsfortegnelse. 
        Din opgave er at udtrække alle punkter (kapitler, underafsnit) præcis som de står.
        Returner KUN et JSON-objekt med formatet: { "toc": [{ "title": "Kapitel navn", "pageNumber": "42" }] }.
        Vær meget præcis med sidetal. Hvis et punkt ikke har sidetal, lad feltet være tomt string.`;

        const contents = [{
            parts: [
                { text: prompt },
                ...input.images.map(base64 => {
                    const data = base64.split(',')[1] || base64;
                    const mimeType = base64.split(';')[0]?.split(':')[1] || 'image/jpeg';
                    return { inlineData: { data, mimeType } };
                })
            ]
        }];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);

        const data = await response.json();
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // Clean markdown if present
        const jsonMatch = textResult.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : textResult;
        const parsed = JSON.parse(jsonString);

        return { success: true, toc: parsed.toc };
    } catch (error: any) {
        console.error("processBookTocAction failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * saveBookAction: Saves a digitized book and its structure to Firestore.
 */
export async function saveBookAction(input: { title: string, author: string, toc: any[] }) {
    if (!adminFirestore) return { success: false };
    try {
        const bookRef = adminFirestore.collection('books').doc();
        const now = FieldValue.serverTimestamp();
        
        await bookRef.set({
            title: input.title,
            author: input.author,
            toc: input.toc,
            status: 'metadata_only',
            createdAt: now,
            updatedAt: now
        });

        return { success: true, id: bookRef.id };
    } catch (error: any) {
        console.error("saveBookAction failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * fetchBookMetadataAction: Scrapes book metadata from isbnsearch.org
 */
export async function fetchBookMetadataAction(isbn: string) {
    try {
        const url = `https://isbnsearch.org/isbn/${isbn.replace(/[-\s]/g, '')}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            throw new Error(`Kunne ikke hente data fra ISBN Search (Status: ${response.status})`);
        }

        const html = await response.text();
        
        // Use Gemini to extract metadata from HTML
        const geminiKey = getGeminiApiKey();
        const prompt = `Du får her rå HTML fra en bogside. Din opgave er at udtrække bogens titel og forfatter.
        Returner KUN et JSON-objekt med formatet: { "title": "Bogens titel", "author": "Forfatterens navn" }.
        Hvis du ikke kan finde informationerne, returner tomme strenge.
        
        HTML:
        ${html.substring(0, 50000)} // Limit size to avoid token issues`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!geminiRes.ok) throw new Error("Gemini kunne ikke analysere HTML'en.");

        const data = await geminiRes.json();
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        const jsonMatch = textResult.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : textResult;
        const parsed = JSON.parse(jsonString);

        return { success: true, metadata: parsed };
    } catch (error: any) {
        console.error("fetchBookMetadataAction failed:", error);
        return { success: false, error: error.message };
    }
}

/**
 * sendAdminEmailAction: Allows admins to send manual emails to user groups.
 */
export async function sendAdminEmailAction(input: {
    subject: string;
    body: string;
    targetGroup: 'Kollega' | 'Kollega+' | 'all';
    adminUid: string;
}) {
    try {
        // 1. Verify admin role
        const adminDoc = await adminFirestore.collection('users').doc(input.adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new Error("Ingen adgang: Brugeren er ikke admin.");
        }

        // 2. Fetch recipients
        let query: any = adminFirestore.collection('users');
        if (input.targetGroup !== 'all') {
            query = query.where('membership', '==', input.targetGroup);
        }
        
        const snap = await query.get();
        const users = snap.docs.map((doc: any) => ({
            email: doc.data().email,
            username: doc.data().username || 'Kollega',
            emailEnabled: doc.data().emailNotificationsEnabled !== false // Default to true
        })).filter((u: any) => u.email && u.email.includes('@') && u.emailEnabled);

        if (users.length === 0) {
            return { success: false, error: "Ingen modtagere fundet i den valgte gruppe." };
        }

        // 3. Send emails in batches (Resend limit is 100 per batch)
        const batchSize = 100;
        let sentCount = 0;
        
        for (let i = 0; i < users.length; i += batchSize) {
            const chunk = users.slice(i, i + batchSize);
            
            const emailPayload = chunk.map(u => ({
                from: 'Cohéro <info@platform.cohero.dk>',
                to: u.email,
                subject: input.subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #fdfcf8; padding: 40px; border-radius: 20px;">
                        <h2 style="color: #4338ca; font-size: 24px; font-family: serif;">Hej ${u.username}</h2>
                        <div style="font-size: 16px; line-height: 1.6; color: #334155;">
                            ${input.body.replace(/\n/g, '<br/>')}
                        </div>
                        <hr style="margin: 40px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                        <p style="font-size: 11px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                            Du modtager denne mail, fordi du er en del af Cohéro-fællesskabet.<br/>
                            © ${new Date().getFullYear()} Cohéro I/S • Træn din faglighed. Trygt.
                        </p>
                    </div>
                `
            }));

            const { data, error } = await resend.batch.send(emailPayload);
            if (error) {
                console.error("Resend batch error:", error);
                throw new Error("Fejl ved afsendelse via Resend: " + (error as any).message);
            }
            sentCount += chunk.length;
        }

        // Log the activity
        await adminFirestore.collection('admin_logs').add({
            action: 'broadcast_email',
            adminUid: input.adminUid,
            subject: input.subject,
            targetGroup: input.targetGroup,
            recipientCount: sentCount,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, sentCount };

    } catch (error: any) {
        console.error("sendAdminEmailAction failed:", error);
        return { success: false, error: error.message };
    }
}
