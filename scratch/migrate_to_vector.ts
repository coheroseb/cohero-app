import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const FLOW_URL = "https://runaiflow-7pguetq4hq-uc.a.run.app";
const DATABASE_ID = "cohero-database";

// Initialize Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "studio-7870211338-fe921"
    });
}

const db = (admin.firestore as any)(undefined, DATABASE_ID);

async function migrate() {
    console.log("🚀 Starter Vector Migrering...");
    
    try {
        // 1. Find alle brugere
        const usersSnapshot = await db.collection('users').get();
        console.log(`Found ${usersSnapshot.size} users.`);
        
        let totalProcessed = 0;
        let totalSuccess = 0;
        
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            console.log(`\nChecking user: ${userId}...`);
            
            // 2. Find materialer for denne bruger som mangler vector index
            const materialsSnapshot = await db.collection(`users/${userId}/materials`)
                .where('vectorIndexed', '!=', true)
                .get();
                
            if (materialsSnapshot.empty) {
                console.log(`  - Ingen manglende materialer.`);
                continue;
            }
            
            console.log(`  - Fundet ${materialsSnapshot.size} materialer der skal indekseres.`);
            
            for (const matDoc of materialsSnapshot.docs) {
                const materialId = matDoc.id;
                const data = matDoc.data();
                
                // Vi har brug for rawText for at kunne lave embeddings
                const rawText = data.rawText || data.extractedText || data.text;
                
                if (!rawText || rawText.length < 10) {
                    console.log(`    ⚠️ Skipper ${materialId}: Ingen tekst fundet.`);
                    continue;
                }
                
                console.log(`    Processing: ${data.fileName || materialId} (${rawText.length} chars)...`);
                
                try {
                    // 3. Kald AI Flow til indeksering
                    const response = await fetch(FLOW_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            flowName: "indexMaterialFlow",
                            data: {
                                userId,
                                materialId,
                                rawText
                            }
                        })
                    });
                    
                    const resData: any = await response.json();
                    
                    if (response.ok && resData.success) {
                        console.log(`    ✅ Succes: ${materialId}`);
                        totalSuccess++;
                    } else {
                        console.error(`    ❌ Fejl ved ${materialId}:`, resData);
                    }
                } catch (flowError: any) {
                    console.error(`    ❌ Netværksfejl ved ${materialId}:`, flowError.message);
                }
                
                totalProcessed++;
                
                // Vent lidt for at undgå Rate Limits på Gemini API
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }
        
        console.log(`\n--- MIGRERING FÆRDIG ---`);
        console.log(`Total fundet: ${totalProcessed}`);
        console.log(`Total succes: ${totalSuccess}`);
        
    } catch (err) {
        console.error("Fatal fejl under migrering:", err);
    }
}

migrate();
