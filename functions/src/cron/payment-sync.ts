
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { stripe, getMembershipFromPriceId } from "../lib/stripe-helper";

/**
 * Scheduled function to automatically sync user subscription statuses with Stripe.
 * Runs every day at 06:00 Copenhagen time.
 */
export const syncPaymentStatus = functions.pubsub
  .schedule("0 6 * * *")
  .timeZone("Europe/Copenhagen")
  .onRun(async (context) => {
    const firestore = (admin.firestore as any)(undefined, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)");
    
    const logRef = firestore.collection('systemLogs').doc();
    const startTime = new Date();
    
    console.log(`[PaymentSync] Started daily synchronization at ${startTime.toISOString()}`);
    
    const runLog: any = {
        type: 'payment_sync',
        status: 'running',
        startTime: admin.firestore.Timestamp.fromDate(startTime),
        processedCount: 0,
        downgradeCount: 0,
        errorCount: 0,
        details: []
    };

    // Save initial log state
    await logRef.set(runLog);
    
    // Find all users who have an active (or previously active) subscription ID
    const usersSnap = await firestore.collection('users')
        .where('stripeSubscriptionId', '!=', null)
        .get();

    console.log(`[PaymentSync] Iterating through ${usersSnap.size} potentially paying users...`);

    if (usersSnap.empty) {
        console.log("[PaymentSync] No users with stripeSubscriptionId found matching criteria.");
        await logRef.update({ 
            status: 'completed', 
            endTime: admin.firestore.FieldValue.serverTimestamp(),
            message: "Ingen betalende brugere fundet." 
        });
        return { success: true, updatedCount: 0 };
    }

    let updatedCount = 0;
    let downgradeCount = 0;
    let errorCount = 0;
    let batch = firestore.batch();
    let batchCount = 0;
    const details: string[] = [];

    for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const subId = userData.stripeSubscriptionId;

        if (!subId || typeof subId !== 'string') continue;

        try {
            const subscription = await stripe.subscriptions.retrieve(subId);
            const price = subscription.items.data[0].price;
            const membershipLevel = getMembershipFromPriceId(price.id);

            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            const wasPaying = userData.membership !== 'Kollega' && userData.membership !== 'Gratis Plan';
            
            if (!isActive && wasPaying) {
                const reason = `Stripe status: ${subscription.status}`;
                const logMsg = `DOWNGRADE: ${userData.email || userDoc.id} (${userData.membership} -> Kollega). Årsag: ${reason}`;
                console.log(`[PaymentSync] ❗ ${logMsg}`);
                details.push(logMsg);
                downgradeCount++;
            }

            batch.update(userDoc.ref, {
                stripeSubscriptionStatus: subscription.status,
                membership: isActive ? membershipLevel : 'Kollega',
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            updatedCount++;
            batchCount++;

            if (batchCount >= 400) {
                await batch.commit();
                batch = firestore.batch();
                batchCount = 0;
            }

        } catch (err: any) {
            const errorMsg = `Fejl ved bruger ${userData.email || userDoc.id}: ${err.message}`;
            console.error(`[PaymentSync] ❌ ${errorMsg}`);
            details.push(`ERROR: ${errorMsg}`);
            errorCount++;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    const endTime = new Date();
    console.log(`[PaymentSync] Finished at ${endTime.toISOString()}. Total processed: ${updatedCount}, Total downgraded: ${downgradeCount}, Errors: ${errorCount}`);

    await logRef.update({
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        endTime: admin.firestore.Timestamp.fromDate(endTime),
        processedCount: updatedCount,
        downgradeCount: downgradeCount,
        errorCount: errorCount,
        details: details.slice(0, 100) // Keep details manageable in Firestore
    });

    return { 
        success: true, 
        updatedCount,
        downgradeCount,
        errorCount
    };
  });
