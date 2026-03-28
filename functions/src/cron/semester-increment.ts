
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

/**
 * Scheduled function to automatically increment user semesters.
 * Runs on February 1st and September 1st at midnight Copenhagen time.
 */
export const incrementUserSemesters = functions.pubsub
  .schedule("0 0 1 2,9 *")
  .timeZone("Europe/Copenhagen")
  .onRun(async (context) => {
    const firestore = admin.firestore();
    const usersRef = firestore.collection("users");
    
    // Process only students who are not yet qualified
    const snapshot = await usersRef
      .where("role", "==", "user")
      .where("isQualified", "==", false)
      .get();

    console.log(`[SemesterIncrement] Starting process for ${snapshot.size} users...`);

    const batchSize = 500;
    let batch = firestore.batch();
    let count = 0;
    let updatedCount = 0;
    let qualifiedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const semester = data.semester;

      if (!semester || typeof semester !== 'string') continue;

      // Extract number from semester string (e.g., "4. semester" -> 4)
      const match = semester.match(/\d+/);
      if (match) {
        const currentSem = parseInt(match[0]);
        const nextSem = currentSem + 1;

        // Create the new semester string by replacing the number
        const nextSemesterStr = semester.replace(/\d+/, nextSem.toString());
        
        const updates: any = {
          semester: nextSemesterStr,
          lastSemesterAutoIncrement: admin.firestore.FieldValue.serverTimestamp(),
          semestersWithCohero: admin.firestore.FieldValue.increment(1),
        };

        // Logic: Most programs (like Socialrådgiver) are 7 semesters. 
        // If they increment past 7, we automatically mark them as qualified.
        if (nextSem > 7) {
            updates.isQualified = true;
            updates.semester = ""; // Clear semester for qualified users
            qualifiedCount++;
        }

        batch.update(doc.ref, updates);
        updatedCount++;
        count++;

        // Commit batches of 500 to respect Firestore limits
        if (count >= batchSize) {
          await batch.commit();
          batch = firestore.batch();
          count = 0;
        }
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log(`[SemesterIncrement] Completed. Updated: ${updatedCount}, Newly Qualified: ${qualifiedCount}`);
    return { success: true, updatedCount, qualifiedCount };
  });
