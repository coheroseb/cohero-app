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

async function findMaterials() {
    try {
        console.log("Querying all materials collections...");
        const materialsGroupSnap = await adminFirestore.collectionGroup('materials').limit(20).get();
        console.log(`Found ${materialsGroupSnap.docs.length} materials across all users.`);
        
        for (const doc of materialsGroupSnap.docs) {
            const material = doc.data();
            // Path structure is users/{userId}/materials/{materialId}
            const pathParts = doc.ref.path.split('/');
            const userId = pathParts[1];
            const materialId = doc.id;
            
            console.log(`User ID: ${userId}`);
            console.log(`  - Material ID: ${materialId}`);
            console.log(`  - Name: ${material.fileName || material.name}`);
            console.log(`  - Semester: ${material.semester}`);
            
            // Check chunks
            const chunksSnap = await adminFirestore.collection('users')
                .doc(userId)
                .collection('materialChunks')
                .where('materialId', '==', materialId)
                .limit(5)
                .get();
            
            console.log(`  - Chunks count for this material: ${chunksSnap.docs.length}`);
            if (chunksSnap.docs.length > 0) {
                console.log(`    * First chunk text snippet: "${chunksSnap.docs[0].data().text?.substring(0, 100)}..."`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

findMaterials();
