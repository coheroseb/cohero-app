
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { fetchFolketingetSagById } from "../lib/oda";

export const checkFolketingetUpdates = functions.pubsub
  .schedule('every 12 hours')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const db = admin.firestore();
    const followedSagerCol = db.collection('followedSager');
    const snapshot = await followedSagerCol.get();
    
    if (snapshot.empty) {
        console.log("No followed sager found.");
        return null;
    }
    
    // Group follows by sagId to optimize API calls
    const sagToUsers: Record<number, { docRef: admin.firestore.DocumentReference, userId: string, userEmail: string, userName: string, oldStatusId: number }[]> = {};
    const allUniqueSagIds = new Set<number>();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const { sagId, statusId, userId, userEmail, userName } = data;
        if (!sagId || !userId) continue;

        const sId = parseInt(sagId);
        if (isNaN(sId)) continue;

        allUniqueSagIds.add(sId);
        if (!sagToUsers[sId]) sagToUsers[sId] = [];
        sagToUsers[sId].push({
            docRef: doc.ref,
            userId,
            userEmail: userEmail || '',
            userName: userName || 'Bruger',
            oldStatusId: statusId
        });
    }

    // Process each unique SagId
    const userUpdates: Record<string, { email: string, name: string, sager: { title: string, sagId: number }[] }> = {};

    for (const sagId of allUniqueSagIds) {
        const latestSagData = await fetchFolketingetSagById(sagId);
        if (!latestSagData) continue;

        const newStatusId = latestSagData.statusid;
        const follows = sagToUsers[sagId];

        for (const follow of follows) {
            if (follow.oldStatusId !== newStatusId) {
                console.log(`Status change for User ${follow.userId} on Sag ${sagId}: ${follow.oldStatusId} -> ${newStatusId}`);

                // 1. Update Firestore
                await follow.docRef.update({
                    statusId: newStatusId,
                    lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // 2. Queue for Notification
                if (!userUpdates[follow.userId]) {
                    userUpdates[follow.userId] = {
                        email: follow.userEmail,
                        name: follow.userName,
                        sager: []
                    };
                }
                userUpdates[follow.userId].sager.push({
                    title: latestSagData.titel || `Sag ${sagId}`,
                    sagId: sagId
                });
            }
        }
    }

    // 3. Send grouped notifications per user
    for (const [userId, updateInfo] of Object.entries(userUpdates)) {
        if (updateInfo.sager.length === 0) continue;

        const count = updateInfo.sager.length;
        const mainTitle = count === 1 ? updateInfo.sager[0].title : `${count} sager opdateret`;
        
        await db.collection("notifications_queue").add({
            title: "Statusændring på din overvågning! 🏛️",
            body: `Der er sket ændringer i ${count === 1 ? `"${updateInfo.sager[0].title}"` : `${count} af dine fulgte sager`}. Tjek dem i Politisk Puls.`,
            recipientUids: [userId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "pending",
            type: "folketinget_update",
            link: count === 1 ? `/folketinget/case/view/${updateInfo.sager[0].sagId}` : "/folketinget"
        });

        // Email logic
        try {
            const { allFlows } = await import("../ai/flows-export.js");
            if (allFlows["generateCaseUpdateEmailFlow"] && updateInfo.email) {
                await allFlows["generateCaseUpdateEmailFlow"]({
                    userName: updateInfo.name,
                    caseTitle: mainTitle,
                    caseUrl: `https://cohero.dk/folketinget`,
                    userEmail: updateInfo.email
                });
            }
        } catch (e) {
            console.error("Failed to send email upate for user:", userId, e);
        }
    }

    return null;
  });
