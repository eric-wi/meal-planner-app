import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export function isStripeConfigured() {
  return Boolean(stripe && process.env.STRIPE_WEBHOOK_SECRET && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
}

export function getMockCheckoutUrl() {
  return "/billing?mockCheckout=1";
}
