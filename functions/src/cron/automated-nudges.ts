import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';


export const dailyAutomatedNudges = functions.pubsub
  .schedule('every day 11:00')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const db = (admin.firestore as any)(undefined, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)");
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const now = new Date();
    const d14 = new Date();
    d14.setDate(d14.getDate() - 14);

    // Find users who haven't been active for a while, prioritizing the most inactive ones
    const inactiveSnap = await db.collection('users')
        .where('role', '==', 'user')
        .orderBy('lastActivityAt', 'asc')
        .limit(100)
        .get();

    for (const doc of inactiveSnap.docs) {
        const u = doc.data() as any;
        
        // Skip if user has disabled email notifications
        if (u.emailNotificationsEnabled === false) continue;

        const lastAct = u.lastActivityAt || u.lastLogin;
        
        if (!lastAct) continue;
        const lastActDate = lastAct.toDate ? lastAct.toDate() : new Date(lastAct);
        
        // Skip if active in the last 14 days
        if (lastActDate > d14) continue;

        // Skip if nudged recently (within last 14 days)
        if (u.lastNudgeSentAt) {
            const lastNudge = u.lastNudgeSentAt.toDate ? u.lastNudgeSentAt.toDate() : new Date(u.lastNudgeSentAt);
            if (lastNudge > d14) continue;
        }

        const daysInactive = Math.floor((now.getTime() - lastActDate.getTime()) / (1000 * 60 * 60 * 24));
        const userName = u.username || u.displayName || "Kollega";
        const membership = u.membership || "Kollega";

        try {
            console.log(`Generating automated nudge for ${userName} (${u.email}). Inactive for ${daysInactive} days. Membership: ${membership}`);
            
            const { allFlows } = await import("../ai/flows-export.js");
            if (!allFlows["nudgeEmailFlow"]) continue;

            const nudgeResult = await allFlows["nudgeEmailFlow"]({
                userName,
                daysInactive,
                membership
            });

            const { subject, content } = nudgeResult.data;

            await resend.emails.send({
                from: 'Sebastian fra Cohéro <sebastian@platform.cohero.dk>',
                to: u.email,
                subject: subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; color: #1e293b; line-height: 1.6;">
                        ${content.replace(/\n/g, '<br/>')}
                        <br/><br/>
                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;"/>
                        <p style="font-size: 11px; color: #94a3b8;">
                            Du modtager denne mail, fordi du er ${membership} medlem hos Cohéro.<br/>
                            <a href="https://student.cohero.dk/settings" style="color: #6366f1; text-decoration: none;">Administrer dine indstillinger her</a>
                        </p>
                    </div>
                `
            });

            // Update user record
            await doc.ref.update({
                lastNudgeSentAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // LOG THE MAIL
            await db.collection("mail_logs").add({
                userId: doc.id,
                email: u.email,
                type: "nudge_email",
                subject: subject,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                automated: true,
                daysInactive: daysInactive
            });

            console.log(`Nudge sent successfully to ${u.email}`);
        } catch (e: any) {
            console.error(`Failed to nudge user ${u.email}:`, e);
            // Log the error to mail_logs as well
            await db.collection("mail_logs").add({
                userId: doc.id,
                email: u.email,
                type: "nudge_email_failed",
                error: e.message || String(e),
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            }).catch(() => {});
        }
    }

    return null;
  });
