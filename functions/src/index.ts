import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load Next.js environment variables for local emulator testing
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
console.log("GEMINI KEY:", !!process.env.GEMINI_API_KEY);

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



import { onRequest } from "firebase-functions/v2/https";

export const runAiFlow = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  const { flowName, data } = req.body;
  if (!flowName) {
     res.status(404).json({ error: "Flow name missing" });
     return;
  }

  try {
     const { allFlows } = await import("./ai/flows-export.js");
     if (!allFlows[flowName]) {
        res.status(404).json({ error: "Flow not found" });
        return;
     }

     const result = await allFlows[flowName](data);
     res.status(200).json(result);
  } catch (error: any) {
     console.error(`Error in flow ${flowName}:`, error);
     res.status(500).json({ error: error.message });
  }
});
