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

async function listBooks() {
    try {
        console.log("Henter bøger fra databasen...");
        const booksSnap = await adminFirestore.collection('books').orderBy('createdAt', 'desc').get();
        console.log(`Fandt ${booksSnap.docs.length} bøger.\n`);

        for (const doc of booksSnap.docs) {
            const book = doc.data();
            const bookId = doc.id;
            
            // Query count of tocChunks subcollection
            const chunksSnap = await adminFirestore.collection('books').doc(bookId).collection('tocChunks').get();
            const chunkCount = chunksSnap.docs.length;

            console.log(`----------------------------------------`);
            console.log(`Titel:      ${book.title || 'N/A'}`);
            console.log(`Forfatter:  ${book.author || 'N/A'}`);
            console.log(`År:         ${book.year || 'N/A'}`);
            console.log(`Udgave:     ${book.edition || 'N/A'}`);
            console.log(`Forlag:     ${book.publisher || 'N/A'}`);
            console.log(`ISBN:       ${book.isbn || 'N/A'}`);
            console.log(`APA 7 Ref:  ${book.apaCitation || 'N/A'}`);
            console.log(`Vektorer:   ${chunkCount} chunks oprettet`);
            console.log(`Oprettet:   ${book.createdAt ? book.createdAt.toDate().toLocaleString('da-DK') : 'N/A'}`);
            console.log(`ID:         ${bookId}`);
        }
        console.log(`----------------------------------------`);
    } catch (e) {
        console.error("Fejl under hentning af bøger:", e);
    }
}

listBooks();
