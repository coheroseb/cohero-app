
const { adminFirestore } = require('./src/firebase/server-init');
async function listLaws() {
    const snap = await adminFirestore.collection('laws').get();
    snap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${doc.id}: ${data.name} (${data.abbreviation})`);
    });
}
listLaws();
