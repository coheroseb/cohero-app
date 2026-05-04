import { adminFirestore } from '../src/firebase/server-init';

async function check() {
    const userId = "tZ2X5E5v4LNoD2qR3v7fM2kG7jX2"; // Need a real userId or list
    const snapshot = await adminFirestore.collectionGroup('materials').limit(1).get();
    if (!snapshot.empty) {
        console.log("Material Data:", JSON.stringify(snapshot.docs[0].data(), null, 2));
    } else {
        console.log("No materials found");
    }
}
check();
