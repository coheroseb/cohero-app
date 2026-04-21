
'use server';

import { stripe, isStripeConfigured } from '@/lib/stripe';
import { adminFirestore, admin } from '@/firebase/server-init';

export async function createShopCheckoutSessionAction(items: any[], userId: string | null, userEmail: string) {
    if (!isStripeConfigured) {
        return { success: false, error: "Stripe er ikke konfigureret på serveren." };
    }

    const finalUserId = userId || `guest_${Date.now()}`;

    try {
        // 1. Create a pending order in Firestore first to get an ID
        const orderRef = await adminFirestore.collection('shop_orders').add({
            userId: finalUserId,
            userEmail,
            isGuest: !userId,
            items,
            total: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'web_shop'
        });

        // 2. Map items for Stripe
        const line_items = items.map(item => ({
            price_data: {
                currency: 'dkk',
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100, // Stripe uses cents/øre
            },
            quantity: item.quantity,
        }));

        // 3. Create Stripe Session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${baseUrl}/shop?status=success&session_id={CHECKOUT_SESSION_ID}&order_id=${orderRef.id}`,
            cancel_url: `${baseUrl}/shop?status=cancelled&order_id=${orderRef.id}`,
            customer_email: userEmail,
            metadata: {
                userId,
                orderId: orderRef.id,
                type: 'shop_purchase'
            },
        });

        return { success: true, sessionId: session.id, url: session.url, orderId: orderRef.id };
    } catch (error: any) {
        console.error('Error creating Stripe shop checkout session:', error);
        return { success: false, error: error.message };
    }
}

export async function getShopProductsAction() {
    try {
        const snapshot = await adminFirestore.collection('shop_products').get();
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, products };
    } catch (error: any) {
        console.error("Error fetching shop products:", error);
        return { success: false, error: error.message };
    }
}
