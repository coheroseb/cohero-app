const fs = require('fs');
const path = require('path');

// 1. Load env
const funcEnvPath = path.join(__dirname, '../functions/.env');
if (fs.existsSync(funcEnvPath)) {
    const envContent = fs.readFileSync(funcEnvPath, 'utf8');
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

// 2. Initialize Firebase Admin from functions node_modules
const admin = require('../functions/node_modules/firebase-admin');
const serviceAccountVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (serviceAccountVar) {
    let sanitizedJson = serviceAccountVar.trim();
    const serviceAccount = JSON.parse(sanitizedJson);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
} else {
    admin.initializeApp();
}

const { explainConceptFlow } = require('../functions/lib/ai/flows/explain-concept-flow.js');

async function test() {
    console.log("Running explainConceptFlow locally...");
    try {
        const result = await explainConceptFlow({
            concept: "socialrådgiver",
            profession: "Socialrådgiver studerende",
            lawContext: "Dette er en prøve på lovgivning."
        });
        console.log("Success! Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Flow failed with error:", err);
    }
}

test();
