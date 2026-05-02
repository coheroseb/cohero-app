const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const config = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
config.private_key = config.private_key.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(config)
  });
}

async function run() {
    try {
        const db = admin.app().firestore('cohero-database');
        const snap = await db.collectionGroup('seminars').get();
        
        console.log(`TOTAL SEMINARS IN DB: ${snap.size}`);
        
        const ownerCounts = {};
        snap.forEach(doc => {
            const path = doc.ref.path;
            const parts = path.split('/');
            const uid = parts[1]; // users/{uid}/seminars/...
            ownerCounts[uid] = (ownerCounts[uid] || 0) + 1;
        });
        
        for (const [uid, count] of Object.entries(ownerCounts)) {
            const userDoc = await db.collection('users').doc(uid).get();
            const email = userDoc.exists ? userDoc.data().email : 'UNKNOWN';
            console.log(`Owner: ${uid} | Email: ${email} | Count: ${count}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
