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
        const listUsersResult = await admin.auth().listUsers(1000);
        const sorted = listUsersResult.users.sort((a, b) => {
            const timeA = new Date(a.metadata.lastSignInTime).getTime();
            const timeB = new Date(b.metadata.lastSignInTime).getTime();
            return timeB - timeA;
        }).slice(0, 5);
        
        console.log("TOP 5 LATEST LOGINS:");
        sorted.forEach(u => {
            console.log(`UID: ${u.uid} | Email: ${u.email} | LastLogin: ${u.metadata.lastSignInTime}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
