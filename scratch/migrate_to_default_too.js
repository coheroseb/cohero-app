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
        const correctUid = 'LUR1lKAMlyYfjtF1rgJnwgHevF83';
        const srcDb = admin.app().firestore('cohero-database');
        const destDb = admin.firestore(); // default
        
        console.log(`Migrating everything from cohero-database to default for UID: ${correctUid}...`);
        
        const groups = ['seminars', 'cases', 'blueprints', 'caseAnalyses', 'savedConcepts'];
        for (const group of groups) {
            const snap = await srcDb.collection('users').doc(correctUid).collection(group).get();
            console.log(`Group ${group}: ${snap.size} docs`);
            
            const targetRef = destDb.collection('users').doc(correctUid).collection(group);
            for (const docSnap of snap.docs) {
                await targetRef.doc(docSnap.id).set(docSnap.data());
            }
        }
        
        console.log(`\nMigration to default complete!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
