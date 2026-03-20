import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

export const processNotificationQueue = functions.firestore
  .document("notifications_queue/{docId}")
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const data = snapshot.data();
    if (!data) return null;

    const {title, body, recipientUids} = data;
    const allTokens: string[] = [];

    const userDocs = await Promise.all(
      recipientUids.map((uid: string) =>
        admin.firestore().collection("users").doc(uid).get()
      )
    );

    for (const doc of userDocs) {
      const tokens = doc.data()?.fcmTokens;
      if (Array.isArray(tokens)) {
        allTokens.push(...tokens);
      }
    }

    const uniqueTokens = [...new Set(allTokens)].filter((t) => !!t);

    if (uniqueTokens.length === 0) {
      return snapshot.ref.update({
        status: "failed",
        error: "No active device tokens found.",
      });
    }

    // Optimized message payload for WebPush/iOS compatibility
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        title: title,
        body: body,
        url: "/portal",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title: title,
          body: body,
          icon: "https://cohero.dk/Lovportal.png",
          badge: "https://cohero.dk/Lovportal.png",
          click_action: "https://cohero.dk/portal",
          requireInteraction: true,
        },
      },
      tokens: uniqueTokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      return snapshot.ref.update({
        status: "completed",
        results: {
          successCount: response.successCount,
          failureCount: response.failureCount,
        },
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const e = error as Error;
      return snapshot.ref.update({
        status: "failed",
        error: e.message,
      });
    }
  });
