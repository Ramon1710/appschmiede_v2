import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cachedStripe) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY missing');
    }
    cachedStripe = new Stripe(secret, {
      apiVersion: '2024-06-20',
    });
  }
  return cachedStripe;
}
