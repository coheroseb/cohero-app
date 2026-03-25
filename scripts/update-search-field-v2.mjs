import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Replace with your service account path or use env
const serviceAccount = JSON.parse(
  await readFile(join(__dirname, '../service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateSearchFields() {
  const collectionRef = db.collection('institutions');
  const snapshot = await collectionRef.get();
  
  console.log(`Opdaterer ${snapshot.size} institutioner...`);
  
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;
  let totalUpdated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = (data.INST_NAVN || '').toLowerCase();
    const type = (data.inst_type_2_tekst || '').toLowerCase();
    const ministry = (data.min_KODE_TEKST || '').toLowerCase();
    
    // Kombineret søgefelt for både navn, type og emne
    const searchName = `${name} ${type} ${ministry}`.trim();
    
    batch.update(doc.ref, { 
      search_name: searchName
    });
    
    count++;
    if (count >= batchSize) {
      await batch.commit();
      totalUpdated += count;
      console.log(`Batch færdig. Total opdateret: ${totalUpdated}`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    totalUpdated += count;
  }

  console.log(`Færdig! Opdaterede ${totalUpdated} institutioner.`);
}

updateSearchFields().catch(console.error);
