import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { data: profile } = await supabase.from('users').select('agency_id, email').eq('id', user.id).single()
  const { data: agency } = await supabase.from('agencies').select('*').eq('id', profile!.agency_id).single()

  // Get or create Stripe customer
  let customerId = agency?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: agency?.name,
      metadata: { agency_id: profile!.agency_id },
    })
    customerId = customer.id

    await supabase
      .from('agencies')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile!.agency_id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: {
            name: 'Mirinate Care — Agency Plan',
            description: 'Full-featured homecare agency management platform',
          },
          unit_amount: 14900, // $149
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: { agency_id: profile!.agency_id },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?billing=canceled`,
    metadata: { agency_id: profile!.agency_id },
  })

  return NextResponse.redirect(session.url!)
}
