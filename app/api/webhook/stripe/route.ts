import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_MINUTES: Record<string, number> = {
  creator: 60 * 60,
  pro: 300 * 60,
  free: 3 * 60,
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan
    if (!userId || !plan) return NextResponse.json({ ok: true })
    await supabaseAdmin.from('profiles').update({
      plan,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      minutes_limit: PLAN_MINUTES[plan] ?? PLAN_MINUTES.free,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabaseAdmin.from('profiles').update({
      plan: 'free',
      stripe_subscription_id: null,
      minutes_limit: PLAN_MINUTES.free,
    }).eq('stripe_customer_id', sub.customer as string)
  }

  return NextResponse.json({ ok: true })
}
