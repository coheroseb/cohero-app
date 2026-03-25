import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

async function check() {
    const snapshot = await db.collection('institutions').limit(5).get();
    console.log(`Documents found: ${snapshot.size}`);
    snapshot.forEach(doc => {
        console.log(`Doc ID: ${doc.id}, Name: ${doc.data().INST_NAVN}`);
    });
}

check().catch(console.error);
