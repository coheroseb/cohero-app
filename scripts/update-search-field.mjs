import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function seed() {
    console.log("Starting update of institutions for case-insensitive search...");
    const data = JSON.parse(fs.readFileSync('./public/insti.json', 'utf8'));
    console.log(`Found ${data.length} institutions in JSON file.`);

    const collectionRef = db.collection('institutions');
    const batchSize = 500;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, i + batchSize);

        chunk.forEach(inst => {
            const docId = inst.INST_NR.toString();
            const docRef = collectionRef.doc(docId);
            
            // Add a lowercased search name for case-insensitive search
            const searchData = {
                ...inst,
                search_name: (inst.INST_NAVN || "").toLowerCase()
            };
            
            batch.set(docRef, searchData, { merge: true });
        });

        await batch.commit();
        console.log(`Updated ${Math.min(i + batchSize, data.length)} institutions...`);
    }

    console.log("Finished update! Case-insensitive search is now supported.");
}

seed().catch(console.error);
