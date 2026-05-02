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
        const dbs = ['default', 'cohero-database'];
        
        for (const dbName of dbs) {
            const db = dbName === 'default' ? admin.firestore() : admin.app().firestore(dbName);
            console.log(`Creating user doc for ${correctUid} in [${dbName}]...`);
            
            await db.collection('users').doc(correctUid).set({
                email: 'seb@cohero.dk',
                displayName: 'Sebastian Viste',
                role: 'admin',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        
        console.log(`\nUser doc created!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
