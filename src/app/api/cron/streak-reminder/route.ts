import { NextRequest, NextResponse } from 'next/server';
import { initializeServerFirebase } from '@/firebase/server-init';
import { sendStreakReminderEmailAction } from '@/app/actions';

/**
 * Cron job to send streak reminders to users who haven't played today.
 * Should be called daily in the evening (e.g., 19:00 / 7 PM).
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const urlSecret = request.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("CRON_SECRET is not set in environment variables.");
        return new NextResponse('Cron secret not configured on server.', { status: 500 });
    }

    const isAuthorizedByHeader = authHeader === `Bearer ${cronSecret}`;
    const isAuthorizedByUrl = urlSecret === cronSecret;

    if (!isAuthorizedByHeader && !isAuthorizedByUrl) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { firestore } = initializeServerFirebase();
        
        // Find users with an active streak (> 0)
        const usersSnap = await firestore.collection('users')
            .where('dailyChallengeStreak', '>', 0)
            .get();

        if (usersSnap.empty) {
            return NextResponse.json({ success: true, message: 'No users with active streaks found.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let remindersSent = 0;
        const results: string[] = [];

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const lastPlayedTimestamp = userData.lastDailyChallengeDate;
            const lastPlayedDate = lastPlayedTimestamp?.toDate ? lastPlayedTimestamp.toDate() : (lastPlayedTimestamp ? new Date(lastPlayedTimestamp) : null);
            
            if (lastPlayedDate) {
                lastPlayedDate.setHours(0, 0, 0, 0);
            }

            // If they haven't played today yet
            if (!lastPlayedDate || lastPlayedDate.getTime() < today.getTime()) {
                
                // Optional: Check if we already sent a reminder today to avoid spamming
                const lastReminderDate = userData.streakReminderSentAt?.toDate ? userData.streakReminderSentAt.toDate() : (userData.streakReminderSentAt ? new Date(userData.streakReminderSentAt) : null);
                if (lastReminderDate) {
                    lastReminderDate.setHours(0, 0, 0, 0);
                    if (lastReminderDate.getTime() === today.getTime()) {
                        continue; // Already sent today
                    }
                }

                if (userData.email) {
                    await sendStreakReminderEmailAction({
                        userEmail: userData.email,
                        userName: userData.displayName || userData.username || 'Kollega',
                        streakCount: userData.dailyChallengeStreak,
                        userId: userDoc.id
                    });

                    // Update the user doc with the last reminder timestamp
                    await userDoc.ref.update({
                        streakReminderSentAt: new Date()
                    });

                    remindersSent++;
                    results.push(`Sent to ${userData.email}`);
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `${remindersSent} streak reminders sent.`,
            details: results
        });

    } catch (error: any) {
        console.error('Cron job for streak reminders failed:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
