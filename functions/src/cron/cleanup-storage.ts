import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

/**
 * Cleanup Storage Artifacts
 * Runs once a day to delete temporary seminar artifacts older than 7 days.
 * This ensures storage costs are kept low by removing stale data.
 */
export const cleanupStorageArtifacts = onSchedule({
  schedule: '0 3 * * *',
  timeZone: 'Europe/Copenhagen',
  memory: '256MiB'
}, async (event) => {
  const bucket = admin.storage().bucket();
  // We target paths like 'seminar_artifacts/' or where temporary files are stored
  const [files] = await bucket.getFiles({ prefix: 'seminar_artifacts/' });
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  const deletePromises = files.map(async (file) => {
    const [metadata] = await file.getMetadata();
    const timeStr = metadata.updated || metadata.timeCreated || new Date().toISOString();
    const updatedTime = new Date(timeStr).getTime();
    
    if (updatedTime < sevenDaysAgo) {
      await file.delete();
      deletedCount++;
    }
  });

  await Promise.all(deletePromises);
  
  console.log(`[StorageCleanup] Successfully purged ${deletedCount} stale assets.`);
});
