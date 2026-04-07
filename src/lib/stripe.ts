import Stripe from 'stripe';

// We initialize Stripe lazily or handle the missing key gracefully 
// to avoid crashing the entire application during module evaluation 
// if environment variables are missing.

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || '', {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2024-04-10',
  appInfo: {
    name: 'Cohéro - Din Fagfalle',
    version: '0.1.0',
  },
  typescript: true,
});

export const isStripeConfigured = !!stripeSecretKey;

/**
 * Centered mapping logic for Stripe Price IDs to Membership Levels.
 * This ensures consistency across webhooks, server actions, and UI.
 */
export function getMembershipFromPriceId(priceId: string | null | undefined): string {
    if (!priceId) return 'Kollega';
    
    // Standard ID lists (checks both server-side and client-facing env naming conventions)
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

    return 'Kollega+'; // Default fallback for unknown but valid paying prices
}
