import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  const { data: agency } = await supabase.from('agencies').select('stripe_customer_id').eq('id', profile!.agency_id).single()

  if (!agency?.stripe_customer_id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-checkout`)
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: agency.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings`,
  })

  return NextResponse.redirect(session.url)
}
