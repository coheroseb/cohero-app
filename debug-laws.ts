import { adminFirestore } from './src/firebase/server-init';

async function listLaws() {
    const snapshot = await adminFirestore.collection('laws').get();
    const laws = snapshot.docs.map(doc => ({ id: doc.id, name: doc.get('name'), abbr: doc.get('abbreviation') }));
    console.log('--- FIRESTORE LAWS ---');
    console.table(laws);
}

listLaws().catch(console.error);
