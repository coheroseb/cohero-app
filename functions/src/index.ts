import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config(); // Loads .env in functions/
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
console.log("GEMINI KEY:", !!process.env.GEMINI_API_KEY);

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'cohero-database';

admin.initializeApp({
  storageBucket: "studio-7870211338-fe921.firebasestorage.app"
});

export const processNotificationQueue = functions.firestore
  .database(databaseId)
  .document("notifications_queue/{docId}")
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const data = snapshot.data();
    if (!data) return null;

    const {title, body, recipientUids} = data;
    const allTokens: string[] = [];

    const userDocs = await Promise.all(
      recipientUids.map((uid: string) =>
        (admin.firestore as any)(undefined, databaseId).collection("users").doc(uid).get()
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
          icon: "https://student.cohero.dk/Lovportal.png",
          badge: "https://student.cohero.dk/Lovportal.png",
          click_action: "https://student.cohero.dk/portal",
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
        processedAt: FieldValue.serverTimestamp(),
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
import { logAiUsage } from "./lib/usage-tracker";

export const runAiFlow = onRequest({ 
  timeoutSeconds: 300, 
  memory: "1GiB",
  minInstances: 1 // Optimize cold starts for better UX
}, async (req, res) => {
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
     console.log(`[runAiFlow] Request for: "${flowName}". Available flows:`, Object.keys(allFlows));
     
     if (!allFlows[flowName]) {
        res.status(404).json({ error: `Flow not found: ${flowName}` });
        return;
     }

     const isStreaming = req.body.stream === true;

     if (isStreaming) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        try {
          const streamRes = await allFlows[flowName].stream(data);
          for await (const chunk of streamRes.stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          const finalResult = await streamRes.response;
          res.write(`data: ${JSON.stringify({ done: true, result: finalResult })}\n\n`);
          res.end();
          
          // Log usage after stream ends
          if (finalResult && finalResult.usage) {
             const { inputTokens = 0, outputTokens = 0 } = finalResult.usage;
             logAiUsage(flowName, { inputTokens, outputTokens }).catch(() => {});
          }
        } catch (streamError: any) {
          console.error(`Stream error in ${flowName}:`, streamError);
          res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
          res.end();
        }
        return;
     }

     const result = await allFlows[flowName](data);

     // Log token usage to Firestore for AI Finans dashboard
     if (result && result.usage) {
        const { inputTokens = 0, outputTokens = 0 } = result.usage;
        if (inputTokens > 0 || outputTokens > 0) {
           logAiUsage(flowName, { inputTokens, outputTokens })
             .catch(err => console.error("Failed to log AI usage:", err));
        }
     }

     res.status(200).json(result);
  } catch (error: any) {
     console.error(`Error in flow ${flowName}:`, error);
     if (!res.headersSent) {
       res.status(500).json({ error: error.message });
     }
  }
});

import { checkFolketingetUpdates } from "./cron/check-ft-updates";
import { incrementUserSemesters } from "./cron/semester-increment";
import { weeklyAdminReport } from "./cron/weekly-admin-report";
import { dailyAutomatedNudges } from "./cron/automated-nudges";
import { dailyNewUserActivationNudge } from "./cron/new-user-activation-nudge";
// import { weeklyStudyCompanion } from "./cron/study-companion-newsletter";
import { cleanupStorageArtifacts } from "./cron/cleanup-storage";
import { syncPaymentStatus } from "./cron/payment-sync";
import { checkViveUpdates } from "./cron/check-vive-updates";

export { 
  checkFolketingetUpdates, 
  incrementUserSemesters, 
  weeklyAdminReport, 
  dailyAutomatedNudges,
  dailyNewUserActivationNudge,
  // weeklyStudyCompanion,
  cleanupStorageArtifacts,
  syncPaymentStatus,
  checkViveUpdates
};

import { onAssistanceRequestUpdate, onAssistanceRequestCreate } from "./assistance_notifications";
export { onAssistanceRequestUpdate, onAssistanceRequestCreate };

import { onUserUpdateScanStudentCard, onUserDeleteCleanUp, generateSSOToken } from "./users";
export { onUserUpdateScanStudentCard, onUserDeleteCleanUp, generateSSOToken };

import { onShopOrderUpdate } from "./shop";
export { onShopOrderUpdate };

import { retsinformationProxy } from "./retsinformation";
export { retsinformationProxy };

import { onMaterialDelete } from "./materials";
export { onMaterialDelete };

