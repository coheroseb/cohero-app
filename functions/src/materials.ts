import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'cohero-database';

/**
 * onMaterialDelete
 * Triggers when a material document is deleted.
 * Cleans up all vector chunks associated with that material.
 */
export const onMaterialDelete = functions.firestore
    .database(databaseId)
    .document("users/{userId}/materials/{materialId}")
    .onDelete(async (snapshot, context) => {
        const { userId, materialId } = context.params;
        const firestore = (admin.firestore as any)(undefined, databaseId);
        
        console.log(`[onMaterialDelete] Cleaning up chunks for material ${materialId} (User: ${userId})`);
        
        try {
            const chunksCol = firestore.collection(`users/${userId}/materialChunks`);
            const snapshot = await chunksCol.where('materialId', '==', materialId).get();
            
            if (snapshot.empty) {
                console.log(`[onMaterialDelete] No chunks found for material ${materialId}`);
                return null;
            }
            
            const batch = firestore.batch();
            snapshot.docs.forEach((doc: any) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log(`[onMaterialDelete] Successfully deleted ${snapshot.size} chunks for material ${materialId}`);
            
            return { success: true, deletedCount: snapshot.size };
        } catch (error) {
            console.error(`[onMaterialDelete] Error cleaning up chunks for ${materialId}:`, error);
            return null;
        }
    });
