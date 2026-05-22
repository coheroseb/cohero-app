const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local
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

// Ensure the database ID is in env
process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID = "cohero-database";

// Disable SSL verification issues if any
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 2. Import the flow from compiled functions lib
// Note: We need to import server-init first so it registers the app
const { adminFirestore } = require('../functions/lib/firebase/server-init');
const { explainConceptFlow } = require('../functions/lib/ai/flows/explain-concept-flow');

async function testLocalFlow() {
    console.log("Starting local execution of explainConceptFlow for 'Bourdieu'...");
    try {
        const result = await explainConceptFlow({
            concept: 'Bourdieu',
            profession: 'Socialrådgiver'
        });
        console.log("\nFLOW RESULT SUCCESSFUL!");
        console.log(JSON.stringify(result.data, null, 2));
    } catch (e) {
        console.error("Local flow execution failed:", e);
    }
}

testLocalFlow();
