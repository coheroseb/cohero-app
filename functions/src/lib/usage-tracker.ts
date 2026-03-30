
import * as admin from 'firebase-admin';

/**
 * Centrally log AI token usage to Firestore for platform-wide cost analysis.
 * This is used for all AI flows, whether triggered via HTTP or internal backend processes.
 * 
 * We use a sanitized flowName to avoid Firestore field path issues (dots create nesting).
 */
export async function logAiUsage(flowName: string, usage: { inputTokens?: number; outputTokens?: number }) {
  if (!usage) return;
  
  const { inputTokens = 0, outputTokens = 0 } = usage;
  if (inputTokens <= 0 && outputTokens <= 0) return;

  // Sanitize flowName to be a valid flat field in Firestore (replace dots and slashes)
  const safeFlowName = flowName.replace(/\./g, '_').replace(/\//g, '_').replace(/\s+/g, '');

  try {
    const db = admin.firestore();
    await db.collection('stats').doc('ai_usage').set({
      totalInputTokens: admin.firestore.FieldValue.increment(inputTokens),
      totalOutputTokens: admin.firestore.FieldValue.increment(outputTokens),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      // Use sanitized name to ensure it's a flat entry in the flows map
      [`flows.${safeFlowName}.inputTokens`]: admin.firestore.FieldValue.increment(inputTokens),
      [`flows.${safeFlowName}.outputTokens`]: admin.firestore.FieldValue.increment(outputTokens),
    }, { merge: true });
  } catch (usageErr) {
    console.error(`Failed to log usage stats for flow ${flowName}:`, usageErr);
  }
}
