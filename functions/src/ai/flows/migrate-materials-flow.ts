import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { indexMaterialFlow } from './index-material-flow';

export const migrateMaterialsFlow = ai.defineFlow(
    {
        name: 'migrateMaterialsFlow',
        inputSchema: z.object({
            limit: z.number().optional().default(20)
        }),
        outputSchema: z.object({
            processed: z.number(),
            success: z.number(),
            details: z.array(z.string())
        })
    },
    async (input) => {
        const db = getFirestore('cohero-database');
        console.log("🚀 Starter Cloud Migration...");
        
        let processedCount = 0;
        let successCount = 0;
        const details: string[] = [];
        
        // 1. Find brugere (vi kigger på de seneste 100 brugere for at holde det overskueligt)
        const usersSnapshot = await db.collection('users').limit(100).get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            
            // 2. Find alle materialer for brugeren
            const materialsSnapshot = await db.collection(`users/${userId}/materials`)
                .limit(100)
                .get();
                
            for (const matDoc of materialsSnapshot.docs) {
                const materialId = matDoc.id;
                const data = matDoc.data();
                
                // Stop hvis vi har nået grænsen for denne kørsel
                if (processedCount >= input.limit) break;
                
                // Spring over hvis den allerede er vector indekseret
                if (data.vectorIndexed === true) continue;
                
                const rawText = data.rawText || data.extractedText || data.text;
                
                if (rawText && rawText.length > 10) {
                    try {
                        console.log(`Migrerer ${materialId} for bruger ${userId}...`);
                        
                        // Kør selve indekseringen
                        await indexMaterialFlow({
                            userId,
                            materialId,
                            rawText
                        });
                        
                        processedCount++;
                        successCount++;
                        details.push(`✅ ${data.fileName || materialId}`);
                    } catch (e: any) {
                        console.error(`Fejl ved ${materialId}:`, e);
                        details.push(`❌ ${data.fileName || materialId}: ${e.message}`);
                    }
                    
                    // Vent 500ms mellem hvert dokument for at undgå rate limits
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            if (processedCount >= input.limit) break;
        }
        
        return { processed: processedCount, success: successCount, details };
    }
);
