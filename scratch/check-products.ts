
import { adminFirestore } from './src/firebase/server-init';

async function checkProducts() {
    try {
        const snap = await adminFirestore.collection('shop_products').get();
        console.log(`Found ${snap.size} products.`);
        snap.forEach(doc => {
            console.log(doc.id, doc.data());
        });
    } catch (e) {
        console.error(e);
    }
}

checkProducts();
