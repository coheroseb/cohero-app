import { adminFirestore } from '../src/firebase/server-init';

async function checkCurriculums() {
    const snap = await adminFirestore.collection('curriculums').limit(5).get();
    snap.docs.forEach(doc => {
        console.log(`ID: ${doc.id}`);
        console.log(`PDF URL: ${doc.data().pdfUrl || 'None'}`);
        console.log('---');
    });
}

checkCurriculums().catch(console.error);
