import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export const STRIPE_PRICES = {
  creator: process.env.STRIPE_PRICE_CREATOR!,
  pro: process.env.STRIPE_PRICE_PRO!,
}
