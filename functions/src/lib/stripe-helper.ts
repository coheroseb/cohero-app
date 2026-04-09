
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Cohéro - Din Fagfalle (Functions)',
    version: '1.0.0',
  },
  typescript: true,
});

/**
 * Centered mapping logic for Stripe Price IDs to Membership Levels.
 * Replicated from src/lib/stripe.ts for Functions environment.
 */
export function getMembershipFromPriceId(priceId: string | null | undefined): string {
    if (!priceId) return 'Kollega';
    
    const priceMap: Record<string, string[]> = {
        'Group Pro': [
            process.env.STRIPE_GROUP_PRO_PRICE_ID!,
            process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID!
        ],
        'Kollega+': [
            process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID!, 
            process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID!,
            process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID!,
            process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID!
        ],
        'Semesterpakken': [
            process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID!, 
            process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID!
        ]
    };

    for (const [level, ids] of Object.entries(priceMap)) {
        if (ids.filter(Boolean).includes(priceId)) return level;
    }

    return 'Kollega+'; 
}
