import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'cohero-database';

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
                <img src="https://student.cohero.dk/main_logo.png" alt="Cohéro Logo" style="height: 40px; width: auto; max-width: 100%; display: block; margin: 0 auto;" />
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

// Mapping from VIVE Display Keys (from details.areas) to Filter IDs (used in ?areas= and followedViveAreas)
const AREA_MAPPING: Record<string, string> = {
  "c4290fcb-19f4-465d-b44d-9c5a5be83cbd": "93a09ea5-08f3-126c-ab50-7b3fe0e6d789",
  "9df8bce1-21b0-4f6f-9b60-27aa5c7c81e6": "57a72689-008b-b5df-47f8-b6724c8cea1e",
  "deb48e72-1609-4498-bcba-81a5bcef6c28": "0eca57d7-cd75-42f2-f731-55f82168eb58",
  "f05ecbea-9a6f-4dfc-bd9c-e168bf069467": "fcd9e3a9-a6dc-14be-1f2f-b3b8a9d00e75",
  "0d1332c0-d4ff-4a97-ab8b-815cdac69547": "ae41bac7-c93e-4b56-f432-ac4da9b51c9e",
  "a3376fbf-9ca4-4cbd-bcf6-104805380366": "820b03ed-2b07-8b45-6788-4e3660f2e9a3",
  "26fc4231-ed9e-44b2-b684-2fb88fe73808": "e4043962-757e-9d73-ba9d-973dff77651d",
  "6b7dca3d-4458-43c6-be7e-eff235c1f854": "33c01510-2358-5584-3781-ef97af3a97df"
};

/**
 * checkViveUpdates:
 * Scheduled task that checks for new publications from VIVE.
 * If new publications are found, it notifies users who follow the relevant areas via In-app, Push and Email.
 */
export const checkViveUpdates = functions.pubsub
  .schedule('every 12 hours')
  .onRun(async (context) => {
    const db = (admin.firestore as any)(undefined, databaseId);
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 1. Get last check timestamp from system state
    const configRef = db.collection('systemState').doc('vive_indsigt');
    const configSnap = await configRef.get();
    const lastCheckDate = configSnap.exists ? configSnap.data().lastPublicationDate : '2024-01-01T00:00:00';

    console.log(`[VIVE-CRON] Checking for updates since ${lastCheckDate}`);

    // 2. Fetch latest publications (VIVE API)
    const VIVE_API_URL = `https://www.vive.dk/api/publications?limit=40`;
    
    try {
        const response = await fetch(VIVE_API_URL, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error(`[VIVE-CRON] API Error: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const publications = data.data || [];

        const newPublications = publications.filter((pub: any) => pub.date8601 > lastCheckDate);

        if (newPublications.length === 0) {
            console.log(`[VIVE-CRON] No new publications found.`);
            return null;
        }

        console.log(`[VIVE-CRON] Found ${newPublications.length} new publications.`);

        let latestSeenDate = lastCheckDate;

        for (const pub of newPublications) {
            if (pub.date8601 > latestSeenDate) {
                latestSeenDate = pub.date8601;
            }

            const areas = pub.details?.areas || [];
            // Map the display keys to the filter IDs that users actually follow
            const areaIds = areas.map((a: any) => AREA_MAPPING[a.key] || a.key);

            if (areaIds.length === 0) continue;

            // 3. Find users following at least one of these areas
            const usersSnapshot = await db.collection('users')
                .where('followedViveAreas', 'array-contains-any', areaIds)
                .get();

            if (usersSnapshot.empty) continue;

            const usersData = usersSnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            const uids = usersData.map((u: any) => u.id);
            
            // 4. Notifications & Emails
            const title = "Ny udgivelse fra VIVE! 📚";
            const body = `"${pub.name}" er netop udgivet inden for et af dine interesseområder.`;
            const link = "/vive-indsigt";

            // A. Batched delivery for In-app and Push
            const chunks: string[][] = [];
            for (let i = 0; i < uids.length; i += 500) {
                chunks.push(uids.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const batch = db.batch();
                for (const uid of chunk) {
                    const notifRef = db.collection("users").doc(uid).collection("notifications").doc();
                    batch.set(notifRef, {
                        title,
                        body,
                        type: "info",
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        link
                    });
                }
                const queueRef = db.collection("notifications_queue").doc();
                batch.set(queueRef, {
                    title,
                    body,
                    recipientUids: chunk,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: "pending",
                    link
                });
                await batch.commit();
            }

            // B. Individual Emails via Resend (respecting user preference)
            const emailRecipients = usersData.filter((u: any) => u.email && (u.emailNotificationsEnabled !== false));
            for (const user of emailRecipients) {
                try {
                    const greetingName = user.firstName || (user.username ? user.username.split(' ')[0] : 'Kollega');

                    await resend.emails.send({
                        from: 'Cohéro <info@platform.student.cohero.dk>',
                        to: user.email,
                        subject: `Nyt forskningsresultat fra VIVE: ${pub.name}`,
                        html: wrapEmailHtml(`
                            <h1 style="color: #0f172a; margin-bottom: 16px;">Hej ${greetingName}</h1>
                            <p>Der er netop landet en ny udgivelse fra VIVE inden for dit interesseområde: <strong>${pub.name}</strong>.</p>
                            <p style="font-style: italic; color: #64748b; border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 24px 0;">
                               "${pub.teaser || 'Gå ind på platformen for at læse hele resuméet og hente rapporten.'}"
                            </p>
                            <div style="margin-top: 32px; text-align: center;">
                                <a href="https://student.cohero.dk/vive-indsigt" style="background-color: #451a03; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Læs mere på platformen</a>
                            </div>
                            <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
                                Du modtager denne mail, fordi du følger et emneområde i VIVE Indsigt. Du kan til enhver tid ændre dine notifikationsindstillinger under <a href="https://student.cohero.dk/settings" style="color: #451a03;">Indstillinger</a>.
                             </p>
                        `)
                    });
                } catch (e) {
                    console.error(`[VIVE-CRON] Failed to send email to ${user.email}:`, e);
                }
            }
            
            console.log(`[VIVE-CRON] Notified ${uids.length} users (${emailRecipients.length} via email) about "${pub.name}"`);
        }

        await configRef.set({ 
            lastPublicationDate: latestSeenDate,
            lastCheckedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

    } catch (err) {
        console.error(`[VIVE-CRON] Fatal error:`, err);
    }

    return null;
  });
