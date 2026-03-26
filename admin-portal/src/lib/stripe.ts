import Stripe from 'stripe';

// We initialize Stripe lazily or handle the missing key gracefully 
// to avoid crashing the entire application during module evaluation 
// if environment variables are missing.

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(stripeSecretKey || '', {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'Cohéro - Din Fagfalle',
    version: '0.1.0',
  },
  typescript: true,
});

export const isStripeConfigured = !!stripeSecretKey;
