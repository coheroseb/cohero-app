const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables from .env.local
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

const serviceAccount = JSON.parse(serviceAccountVar.trim());
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

const db = getFirestore(app, 'cohero-database');

async function getGeminiEmbedding(text) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing in env!");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${key}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/gemini-embedding-2',
            content: { parts: [{ text }] },
            outputDimensionality: 768
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Embedding API failed: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

async function testVectorSearch() {
    try {
        const queryText = "Bourdieu social arv habitus";
        console.log(`Genererer embedding for: "${queryText}"...`);
        const queryVector = await getGeminiEmbedding(queryText);
        console.log(`Embedding genereret (dimension: ${queryVector.length})`);

        console.log("Udfører vector search...");
        const snapshot = await db.collectionGroup('tocChunks')
            .findNearest('embedding', admin.firestore.FieldValue.vector(queryVector), {
                limit: 15,
                distanceMeasure: 'COSINE'
            })
            .get();

        console.log(`Fandt ${snapshot.size} matchende chunks.`);
        
        snapshot.docs.forEach((doc, idx) => {
            const data = doc.data();
            console.log(`\n[Match ${idx + 1}]`);
            console.log(`Bog:      ${data.bookTitle} af ${data.bookAuthor}`);
            console.log(`Afsnit:   ${data.title} (side ${data.pageNumber || 'N/A'})`);
            console.log(`Tekst:    "${data.text}"`);
        });

    } catch (e) {
        console.error("Fejl under vector search:", e);
    }
}

testVectorSearch();
