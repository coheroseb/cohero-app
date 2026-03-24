import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

// Helper: Wrap Email HTML (Matching the platform's standard style)
const wrapEmailHtml = (inner: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="background-color: #f8fafc; padding: 40px 20px; width: 100%; box-sizing: border-box;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
            <div style="background-color: #451a03; padding: 32px 40px; text-align: center;">
                <img src="https://cohero.dk/main_logo.png" alt="Cohéro Logo" style="height: 40px; width: auto; max-width: 100%; display: block; margin: 0 auto;" />
            </div>
            <div style="padding: 40px; font-size: 16px; line-height: 1.6; color: #334155;">
                ${inner}
            </div>
            <div style="background-color: #f1f5f9; padding: 32px 40px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                <p style="margin-bottom: 8px;">Du har modtaget denne besked som en del af platformens funktionalitet.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cohéro I/S. Alle rettigheder forbeholdes.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const onAssistanceRequestCreate = functions.firestore
  .document("assistance_requests/{requestId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data) return null;

    const db = admin.firestore();
    const taskTitle = data.title;
    const category = data.category;
    const price = data.price;

    // Notify ALL users (or just students if they have a role)
    // Let's assume we want to reach as many as possible
    try {
        const usersSnapshot = await db.collection("users").select().get();
        const uids = usersSnapshot.docs.map(doc => doc.id);

        if (uids.length > 0) {
            // Queue FCM
            await db.collection("notifications_queue").add({
                title: "Ny opgave på markedspladsen! 📢",
                body: `[${category}] ${taskTitle} (${price} kr.). Se opgaven nu!`,
                recipientUids: uids,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: "pending",
            });

            // Add in-app for each (batched if many, but let's keep it simple for now or use the pattern)
            const chunks: string[][] = [];
            for (let i = 0; i < uids.length; i += 500) {
                chunks.push(uids.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const batch = db.batch();
                for (const uid of chunk) {
                    const notifRef = db.collection("users").doc(uid).collection("notifications").doc();
                    batch.set(notifRef, {
                        title: "Ny opgave! 📢",
                        body: `[${category}] ${taskTitle} (${price} kr.)`,
                        type: "info",
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        link: "/bistand"
                    });
                }
                await batch.commit();
            }
        }
    } catch (err) {
        console.error("Failed to notify users about new task:", err);
    }
    return null;
  });

export const onAssistanceRequestUpdate = functions.firestore
  .document("assistance_requests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after) return null;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const db = admin.firestore();

    // 1. EVENT: TASK CLAIMED (Status changed from open -> claimed)
    if (before.status === "open" && after.status === "claimed") {
      console.log(`Task ${context.params.requestId} claimed by ${after.studentName}`);
      
      const citizenEmail = after.citizenEmail;
      const citizenName = after.citizenName;
      const studentName = after.studentName || "En studerende";
      const taskTitle = after.title;

      // Notify Citizen via Email
      try {
        await resend.emails.send({
          from: "Cohéro <info@platform.cohero.dk>",
          to: citizenEmail,
          subject: `Godt nyt! Din anmodning er blevet taget 🚀`,
          html: wrapEmailHtml(`
            <h1 style="color: #0f172a; margin-bottom: 16px;">Hej ${citizenName}</h1>
            <p>Vi kan med glæde meddele, at <strong>${studentName}</strong> har takket ja til at hjælpe dig med din opgave: <strong>"${taskTitle}"</strong>.</p>
            <p>Det næste skridt er betaling. Når din betaling er registreret, vil den studerende få adgang til dine kontaktoplysninger og kontakte dig med det samme.</p>
            <div style="margin-top: 32px; text-align: center;">
                <a href="https://cohero.dk/anmod-bistand/status/${context.params.requestId}?pay=true" style="background-color: #451a03; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Gå til betaling</a>
            </div>
          `),
        });
      } catch (err) {
        console.error("Failed to send claim email to citizen:", err);
      }

      // If citizen has a UID, send in-app notification
      if (after.citizenId) {
        try {
          await db.collection("notifications_queue").add({
            title: "Opgave taget! 🚀",
            body: `${studentName} har taget din opgave: "${taskTitle}"`,
            recipientUids: [after.citizenId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending",
          });
          
          await db.collection("users").doc(after.citizenId).collection("notifications").add({
            title: "Opgave taget! 🚀",
            body: `${studentName} har taget din opgave: "${taskTitle}"`,
            type: "success",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.error("Failed to queue in-app notification for citizen:", err);
        }
      }
    }

    // 2. EVENT: TASK PAID (isPaid changed from false -> true)
    if (!before.isPaid && after.isPaid) {
      console.log(`Task ${context.params.requestId} marked as paid`);

      const studentId = after.studentId;
      const citizenName = after.citizenName;
      const taskTitle = after.title;

      if (studentId) {
        // Fetch student email
        const studentDoc = await db.collection("users").doc(studentId).get();
        const studentEmail = studentDoc.data()?.email;
        const studentFirstName = studentDoc.data()?.firstName || "Studerende";

        // Notify Student via Email
        if (studentEmail) {
          try {
            await resend.emails.send({
              from: "Cohéro <info@platform.cohero.dk>",
              to: studentEmail,
              subject: `Betaling bekræftet! Du kan nu se kontaktinfo ✅`,
              html: wrapEmailHtml(`
                <h1 style="color: #0f172a; margin-bottom: 16px;">Hej ${studentFirstName}</h1>
                <p>Borgeren <strong>${citizenName}</strong> har nu gennemført betalingen for opgaven: <strong>"${taskTitle}"</strong>.</p>
                <p>Du har nu adgang til borgerens e-mail og telefonnummer inde i portalen, så I kan aftale de nærmere detaljer.</p>
                <div style="margin-top: 32px; text-align: center;">
                    <a href="https://cohero.dk/bistand" style="background-color: #451a03; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Se kontaktoplysninger</a>
                </div>
              `),
            });
          } catch (err) {
            console.error("Failed to send payment email to student:", err);
          }
        }

        // Send Push/In-app notification to Student
        try {
          await db.collection("notifications_queue").add({
            title: "Betaling modtaget! ✅",
            body: `Betalingen for "${taskTitle}" er bekræftet. Du kan nu se kontaktinfo.`,
            recipientUids: [studentId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending",
          });

          await db.collection("users").doc(studentId).collection("notifications").add({
            title: "Betaling modtaget! ✅",
            body: `Betalingen for "${taskTitle}" er bekræftet. Du kan nu se kontaktinfo.`,
            type: "success",
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.error("Failed to queue in-app notification for student:", err);
        }
      }
    }

    return null;
  });
