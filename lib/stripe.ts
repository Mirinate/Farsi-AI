import Stripe from 'stripe'

// Fallback prevents build-time crash; real key required at runtime for API calls
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const MONTHLY_PRICE = 14900 // $149 in cents
export const TRIAL_DAYS = 14
