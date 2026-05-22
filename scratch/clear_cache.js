
// Load dotenv from functions/.env
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Read the service account from the functions .env file
function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};
  // We need to handle the JSON value specially
  const match = content.match(/GOOGLE_SERVICE_ACCOUNT_JSON='(.+?)'\s*(?:\n|$)/s);
  if (match) vars['GOOGLE_SERVICE_ACCOUNT_JSON'] = match[1];
  return vars;
}

async function main() {
  const envVars = readEnvFile(path.join(__dirname, '../functions/.env'));
  const saJson = envVars['GOOGLE_SERVICE_ACCOUNT_JSON'];
  
  if (!saJson) {
    console.error('Could not find GOOGLE_SERVICE_ACCOUNT_JSON in functions/.env');
    process.exit(1);
  }

  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  const sa = JSON.parse(saJson);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');

  const app = initializeApp({ credential: cert(sa) }, 'clear-cache-' + Date.now());
  const db = getFirestore(app, 'cohero-database');

  console.log('Tjekker conceptExplanations-v2 cache...');
  const snap = await db.collection('conceptExplanations-v2').get();
  console.log(`Fandt ${snap.size} cachede forklaringer`);
  
  if (snap.empty) {
    console.log('✅ Cache er allerede tom');
    process.exit(0);
  }

  let batch = db.batch();
  let count = 0;
  let total = 0;
  
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    total++;
    if (count >= 400) {
      await batch.commit();
      console.log(`Slettet ${total}/${snap.size}...`);
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  
  console.log(`✅ Cache ryddet! Slettet ${snap.size} forklaringer fra conceptExplanations-v2`);
}

main().catch(e => { console.error(e); process.exit(1); });
