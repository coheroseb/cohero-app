
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

export const weeklyStudyCompanion = functions.pubsub
  .schedule('every tuesday 10:00') // Weekly study boost every Tuesday
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const db = (admin.firestore as any)(undefined, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)");
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Get all users who are students
    // NOTE: In production with many users, this should be chunked or use a task queue
    const usersSnap = await db.collection('users')
        .where('role', '==', 'user')
        .limit(25) // Processing a small batch for safety in this version
        .get();

    for (const doc of usersSnap.docs) {
        const u = doc.data() as any;
        if (!u.email) continue;

        const userName = u.username || "Studerende";
        const semester = u.semester || "Ukendt Semester";
        const institution = u.institution || "Ukendt Studiested";
        
        // Basic activity context (last few tools used)
        const recentTools: string[] = [];
        if (u.lastLawPortalUsage) recentTools.push("Lov-Portalen");
        if (u.lastCaseTrainerUsage) recentTools.push("Case-Trainer");
        if (u.lastJournalTrainerUsage) recentTools.push("Journal-Trainer");

        try {
            const { allFlows } = await import("../ai/flows-export.js");
            if (!allFlows["studyCompanionFlow"]) continue;

            const companionResult = await allFlows["studyCompanionFlow"]({
                userName,
                semester,
                institution,
                recentToolsUsed: recentTools,
                profession: u.profession
            });

            const { subject, content } = companionResult.data;

            await resend.emails.send({
                from: 'Cohéro Studie-Makker <makker@platform.cohero.dk>',
                to: u.email,
                subject: subject,
                html: `
                    <div style="font-family: 'Inter', sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; background: #ffffff; color: #1e293b;">
                        <div style="text-align: center; margin-bottom: 40px;">
                            <img src="https://cohero.dk/Lovportal.png" width="50" height="50" style="margin-bottom: 12px;"/>
                            <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 0.3em; color: #94a3b8; margin: 0;">Din AI-Studiepartner</p>
                        </div>
                        
                        <div style="line-height: 1.8; font-size: 16px; color: #334155;">
                            ${content.replace(/\n/g, '<br/>')}
                        </div>
                        
                        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                            <p style="font-size: 14px; font-weight: 700; color: #6366f1; margin-bottom: 20px;">Klar på en ny uge med studiet?</p>
                            <a href="https://cohero.dk/portal" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">ÅBN DIN PORTAL NU</a>
                        </div>
                        
                        <div style="margin-top: 40px; text-align: center;">
                             <p style="font-size: 11px; color: #cbd5e1;">
                                Dette er din personlige ugentlige studieopdatering fra Cohéro.<br/>
                                <a href="https://cohero.dk/settings" style="color: #6366f1; text-decoration: none;">Indstillinger & Afmelding</a>
                             </p>
                        </div>
                    </div>
                `
            });

            // LOG THE MAIL
            await db.collection("mail_logs").add({
                userId: doc.id,
                email: u.email,
                type: "study_companion",
                subject: subject,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                semester: semester,
                institution: institution
            });

            console.log(`Weekly study companion email sent to ${u.email}`);

        } catch (e) {
            console.error(`Failed to send study companion to ${u.email}:`, e);
        }
    }

    return null;
  });
