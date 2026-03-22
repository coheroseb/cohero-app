import { NextRequest, NextResponse } from 'next/server';
import { initializeServerFirebase } from '@/firebase/server-init';
import { generateCaseUpdateEmailAction, fetchFolketingetSagById } from '@/app/actions';

// This is the endpoint for the cron job.
// It can be called with a GET request and a secret.
// Method 1 (Header): curl -X GET "https://[YOUR_APP_URL]/api/cron/check-sager" -H "Authorization: Bearer YOUR_CRON_SECRET"
// Method 2 (URL Param): curl -X GET "https://[YOUR_APP_URL]/api/cron/check-sager?secret=YOUR_CRON_SECRET"
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
        const followedSagerSnap = await firestore.collection('followedSager').get();

        if (followedSagerSnap.empty) {
            return NextResponse.json({ success: true, message: 'No followed sager to check.' });
        }

        const sagerToUpdate: { [key: number]: { sagData: any, followers: any[] } } = {};

        // Group followers by sagId to minimize API calls
        for (const followDoc of followedSagerSnap.docs) {
            const followData = followDoc.data();
            const sagId = followData.sagId;
            if (!sagerToUpdate[sagId]) {
                sagerToUpdate[sagId] = { sagData: null, followers: [] };
            }
            sagerToUpdate[sagId].followers.push({ ...followData, docId: followDoc.id });
        }
        
        const batch = firestore.batch();
        let notificationsSent = 0;

        for (const sagIdStr in sagerToUpdate) {
            const sagId = Number(sagIdStr);
            const odaSag = await fetchFolketingetSagById(sagId);

            if (!odaSag) continue;

            const odaOpdateringsdato = new Date(odaSag.opdateringsdato);
            const followers = sagerToUpdate[sagId].followers;

            for (const follower of followers) {
                const lastUpdatedAt = follower.lastUpdatedAt?.toDate ? follower.lastUpdatedAt.toDate() : follower.lastUpdatedAt;

                if (!lastUpdatedAt || odaOpdateringsdato > lastUpdatedAt) {
                    // Send notification email
                    await generateCaseUpdateEmailAction({
                        userName: follower.userName,
                        userEmail: follower.userEmail,
                        caseTitle: odaSag.titel,
                        caseUrl: `https://cohero.dk/folketinget/case/view/${sagId}`,
                    });
                    notificationsSent++;

                    // Update the timestamp in our database
                    const followDocRef = firestore.collection('followedSager').doc(follower.docId);
                    batch.update(followDocRef, { lastUpdatedAt: odaOpdateringsdato });
                }
            }
        }

        if (notificationsSent > 0) {
          await batch.commit();
        }

        return NextResponse.json({ success: true, message: `${notificationsSent} notifications sent.` });

    } catch (error: any) {
        console.error('Cron job for checking sager failed:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
