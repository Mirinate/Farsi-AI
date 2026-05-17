import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const getAgencyIdFromSub = async (subscriptionId: string): Promise<string | null> => {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    return (sub.metadata.agency_id as string) || null
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const agencyId = session.metadata?.agency_id
      if (agencyId && session.subscription) {
        await supabase.from('agencies').update({
          stripe_subscription_id: session.subscription as string,
          plan: 'active',
        }).eq('id', agencyId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = sub.metadata.agency_id
      if (agencyId) {
        const plan = sub.status === 'active' ? 'active' :
                     sub.status === 'past_due' ? 'past_due' :
                     sub.status === 'canceled' ? 'canceled' : 'trial'
        await supabase.from('agencies').update({ plan }).eq('id', agencyId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = sub.metadata.agency_id
      if (agencyId) {
        await supabase.from('agencies').update({ plan: 'canceled' }).eq('id', agencyId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const agencyId = await getAgencyIdFromSub(invoice.subscription as string)
        if (agencyId) {
          await supabase.from('agencies').update({ plan: 'past_due' }).eq('id', agencyId)
        }
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        const agencyId = await getAgencyIdFromSub(invoice.subscription as string)
        if (agencyId) {
          await supabase.from('agencies').update({ plan: 'active' }).eq('id', agencyId)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
