
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

/**
 * Daglig aktiverings-nudge til nye Kollega (gratis) brugere.
 * 
 * Kører dagligt og finder brugere som:
 * - Har oprettet sig for 3-7 dage siden (wave 1: kort nysgerrig-ping)
 * - Har oprettet sig for 14 dage siden (wave 2: lidt mere urgency)
 * - Aldrig har brugt et AI-værktøj
 * - Ikke allerede er nudget inden for de seneste 7 dage
 */
export const dailyNewUserActivationNudge = functions.pubsub
  .schedule('every day 10:00')
  .timeZone('Europe/Copenhagen')
  .onRun(async () => {
    const db = admin.firestore();
    const resend = new Resend(process.env.RESEND_API_KEY);

    const now = new Date();

    const d3 = new Date(now); d3.setDate(d3.getDate() - 3);
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d14 = new Date(now); d14.setDate(d14.getDate() - 14);
    const d21 = new Date(now); d21.setDate(d21.getDate() - 21);

    // Find Kollega (gratis) brugere oprettet for 3-21 dage siden
    const snap = await db.collection('users')
      .where('role', '==', 'user')
      .where('membership', 'in', ['Kollega', null])
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(d21))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(d3))
      .limit(15)
      .get();

    for (const doc of snap.docs) {
      const u = doc.data() as any;
      if (!u.email) continue;

      // Skip hvis de har en aktiv Kollega+ subscription
      if (u.stripeSubscriptionStatus === 'active') continue;

      // Tjek om de har brugt noget som helst
      const hasUsedPlatform = !!(
        u.lastConceptExplainerUsage ||
        u.lastCaseTrainerUsage ||
        u.lastJournalTrainerUsage ||
        u.lastLawPortalUsage
      );

      // Skip aktive brugere
      if (hasUsedPlatform) continue;

      // Skip hvis nudget inden for de seneste 7 dage
      if (u.lastActivationNudgeSentAt) {
        const lastNudge = (u.lastActivationNudgeSentAt.toDate
          ? u.lastActivationNudgeSentAt.toDate()
          : new Date(u.lastActivationNudgeSentAt)) as Date;
        const daysSinceNudge = (now.getTime() - lastNudge.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceNudge < 7) continue;
      }

      const createdAt = (u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) as Date;
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const userName = u.username || u.displayName || "Studerende";
      const profession = u.profession || "Socialrådgiver";

      // Skift budskab baseret på hvor lang tid siden de oprettede sig
      const isWave2 = daysSinceSignup >= 14;

      try {
        console.log(`[ACTIVATION-NUDGE] Sending to ${u.email} (day ${daysSinceSignup}, wave ${isWave2 ? 2 : 1})`);

        const { allFlows } = await import("../ai/flows-export.js");
        if (!allFlows["newUserActivationEmailFlow"]) {
          console.warn(`[ACTIVATION-NUDGE] Flow 'newUserActivationEmailFlow' not found, skipping.`);
          continue;
        }

        const emailResult = await allFlows["newUserActivationEmailFlow"]({
          userName,
          profession,
          daysSinceSignup,
          isWave2,
        });

        const { subject, content } = emailResult.data;

        await resend.emails.send({
          from: 'Sebastian fra Cohéro <sebastian@platform.cohero.dk>',
          to: u.email,
          subject,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; line-height: 1.7; background:#fff; border-radius:24px; overflow:hidden; border: 1px solid #f1f5f9;">
              <div style="background: #0f172a; padding: 32px 40px; text-align:center;">
                <img src="https://cohero.dk/Lovportal.png" width="48" height="48" style="border-radius:12px; margin-bottom:12px;" />
                <p style="text-transform:uppercase; font-size:10px; font-weight:900; letter-spacing:0.3em; color:#94a3b8; margin:0;">Cohéro – Din faglige makker</p>
              </div>
              <div style="padding: 40px;">
                ${content.replace(/\n/g, '<br/>')}
              </div>
              <div style="padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align:center;">
                <a href="https://cohero.dk/portal" style="display:inline-block; background:#0f172a; color:#fbbf24; padding:14px 32px; border-radius:14px; font-weight:900; font-size:13px; text-decoration:none; text-transform:uppercase; letter-spacing:0.1em;">
                  Gå til din portal →
                </a>
                <p style="font-size:11px; color:#cbd5e1; margin-top:20px;">
                  Du modtager denne mail fordi du oprettede en gratis Kollega-konto på Cohéro.<br/>
                  <a href="https://cohero.dk/indstillinger" style="color:#6366f1; text-decoration:none;">Afmeld her</a>
                </p>
              </div>
            </div>
          `
        });

        await doc.ref.update({
          lastActivationNudgeSentAt: admin.firestore.FieldValue.serverTimestamp(),
          activationNudgeCount: admin.firestore.FieldValue.increment(1),
        });

        await db.collection("mail_logs").add({
          userId: doc.id,
          email: u.email,
          type: "activation_nudge",
          subject,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          automated: true,
          daysSinceSignup,
          wave: isWave2 ? 2 : 1,
        });

        console.log(`[ACTIVATION-NUDGE] Sent to ${u.email} ✓`);

      } catch (e) {
        console.error(`[ACTIVATION-NUDGE] Failed for ${u.email}:`, e);
      }
    }

    return null;
  });
