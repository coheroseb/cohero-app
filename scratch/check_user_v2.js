require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

async function run() {
    const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountVar) {
        console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
        return;
    }

    const serviceAccount = JSON.parse(serviceAccountVar);
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    }

    const db = admin.firestore();
    const uid = process.argv[2] || 'QwZRNjVW7vPWbicM0fA2PFLMIAD2';

    console.log(`[DEBUG] Project ID: ${serviceAccount.project_id}`);
    console.log(`[DEBUG] Checking UID: ${uid}`);

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (doc.exists) {
        console.log('✅ User found in "users" collection!');
        console.log('Data:', doc.data());
    } else {
        console.log('❌ User NOT found in "users" collection.');
        
        // List a few users to see what IDs look like
        const snap = await db.collection('users').limit(5).get();
        if (snap.empty) {
            console.log('Collection "users" is empty.');
        } else {
            console.log('Found these other UIDs in "users":');
            snap.docs.forEach(d => console.log(' - ' + d.id));
        }
    }
}

run().catch(console.error);
