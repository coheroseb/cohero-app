const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountVar) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON missing!");
    process.exit(1);
}

let sanitizedJson = serviceAccountVar.trim();
const serviceAccount = JSON.parse(sanitizedJson);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const adminFirestore = getFirestore(app, 'cohero-database');

async function checkData() {
    try {
        console.log("Fetching users...");
        const usersSnap = await adminFirestore.collection('users').limit(10).get();
        console.log(`Found ${usersSnap.docs.length} users.`);
        
        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            console.log(`User: ${userId} (${userData.email || userData.name})`);
            
            // Check materials
            const materialsSnap = await adminFirestore.collection('users')
                .doc(userId)
                .collection('materials')
                .get();
            
            console.log(`  - Materials count: ${materialsSnap.docs.length}`);
            for (const matDoc of materialsSnap.docs) {
                const mat = matDoc.data();
                console.log(`    * Material ID: ${matDoc.id}, Semester: ${mat.semester}, Name: ${mat.fileName || mat.name}`);
                
                // Check chunks
                const chunksSnap = await adminFirestore.collection('users')
                    .doc(userId)
                    .collection('materialChunks')
                    .where('materialId', '==', matDoc.id)
                    .limit(5)
                    .get();
                console.log(`      * Chunks found: ${chunksSnap.docs.length}`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

checkData();
