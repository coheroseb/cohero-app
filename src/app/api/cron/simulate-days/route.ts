import { NextResponse } from 'next/server';
import { adminFirestore } from '@/firebase/server-init';
import { simulateNextDayAction } from '@/app/actions';
import * as admin from 'firebase-admin';

// Force node runtime for firebase-admin compatibility if needed, standard app router defaults to nodejs anyway.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Simple security check (Authorization: Bearer <CRON_SECRET>)
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.CRON_SECRET || 'dev-secret-123';
        
        if (authHeader !== `Bearer ${expectedSecret}` && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // collectionGroup queries require index on production if complex, 
        // but 'activeSimulation' is the collection name, so we can fetch all 'current' documents in it.
        const activeSimsSnapshot = await adminFirestore
            .collectionGroup('activeSimulation')
            .where('status', '==', 'active')
            .get();

        if (activeSimsSnapshot.empty) {
            return NextResponse.json({ message: 'Inden aktive simulationer at opdatere.' });
        }

        const now = new Date();
        let processedCount = 0;

        // Process sequentially to avoid memory issues and respect AI rate limits
        for (const doc of activeSimsSnapshot.docs) {
            const simulation = doc.data();
            if (!simulation.createdAt) continue;

            const startDate = simulation.createdAt.toDate ? simulation.createdAt.toDate() : new Date(simulation.createdAt);
            const diffMs = now.getTime() - startDate.getTime();
            const realDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

            if (realDay > simulation.currentDay) {
                const daysPassed = realDay - simulation.currentDay;
                
                try {
                    const res = await simulateNextDayAction({
                        cases: simulation.cases,
                        previousInbox: simulation.inbox,
                        userJournals: simulation.journals || {},
                        currentDay: realDay,
                        daysPassed: daysPassed,
                        userName: simulation.userName || 'Brugernavn',
                        newDateStr: now.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    });
                    
                    const newInboxEvents = res.data.newEvents.map((i: any) => ({ ...i, isRead: false }));
                    
                    // Update firestore via admin
                    await doc.ref.update({
                        currentDay: realDay,
                        inbox: [...simulation.inbox, ...newInboxEvents],
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    
                    processedCount++;
                } catch (userError) {
                    console.error(`Fejl under opdatering af simulation for doc ${doc.id}:`, userError);
                    // Continue to next user even if this one fails
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Baggrundsprocessering fuldført. Prøvede på ${activeSimsSnapshot.size} aktive. Processerede ${processedCount}.` 
        });

    } catch (error: any) {
        console.error('CRON SIMULATE ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
