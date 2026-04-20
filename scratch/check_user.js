const admin = require('firebase-admin');

// Service account from .env.local (I'll hardcode it just for this debug script if I can, or read from env)
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}

const db = admin.firestore();

async function checkUser(uid) {
    console.log(`Checking user ${uid}...`);
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    if (doc.exists) {
        console.log('User found:', doc.data().username || doc.data().displayName);
    } else {
        console.log('User NOT found.');
        
        // Let's check if the collection 'users' even has documents
        const snap = await db.collection('users').limit(1).get();
        if (snap.empty) {
            console.log('Collection "users" is empty or does not exist.');
        } else {
            console.log('Collection "users" exists and has at least one document:', snap.docs[0].id);
        }
    }
}

const uid = process.argv[2] || 'QwZRNjVW7vPWbicM0fA2PFLMIAD2';
checkUser(uid).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
