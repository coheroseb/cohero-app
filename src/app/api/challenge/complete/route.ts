import { NextRequest, NextResponse } from 'next/server';
import { initializeServerFirebase } from '@/firebase/server-init';
import { increment, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const { firestore } = initializeServerFirebase();
        
        const userRef = firestore.collection('users').doc(userId);
        const docSnap = await userRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 444 });
        }

        const updates: any = {
            cohéroPoints: increment(25),
            lastDailyChallengeDate: serverTimestamp()
        };

        await userRef.update(updates);

        console.log(`[API-CHALLENGE] Successfully rewarded 25 points for user ${userId}`);

        return NextResponse.json({ 
            success: true, 
            pointsAdded: 25, 
            message: "Challenge completed successfully" 
        });
    } catch (err: any) {
        console.error("[API-CHALLENGE] Error completing challenge:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
