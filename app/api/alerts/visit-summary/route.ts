import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/resend'
import { format } from 'date-fns'

// Triggered after checkout (can also be called as cron)
// POST body: { checkInId } or called via cron
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { checkInId } = body

  const authHeader = req.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  if (!checkInId && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  let checkinsToProcess: any[]

  if (checkInId) {
    const { data } = await supabase.from('checkins').select('*').eq('id', checkInId).single()
    checkinsToProcess = data ? [data] : []
  } else {
    // Cron mode: find all checkouts from the last hour that haven't been emailed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .not('checkout_time', 'is', null)
      .gte('checkout_time', oneHourAgo)
    checkinsToProcess = data || []
  }

  let sent = 0

  for (const ci of checkinsToProcess) {
    const [{ data: shift }, { data: visitNote }] = await Promise.all([
      supabase.from('shifts').select('*, caregiver:caregivers(user:users(full_name)), client:clients(full_name)').eq('id', ci.shift_id).single(),
      supabase.from('visit_notes').select('*').eq('shift_id', ci.shift_id).maybeSingle(),
    ])

    if (!shift) continue

    const clientName = (shift.client as any)?.full_name
    const caregiverName = (shift.caregiver as any)?.user?.full_name

    // Get family members for this client
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('*, user:users(email, full_name)')
      .eq('client_id', shift.client_id)

    if (!familyMembers || familyMembers.length === 0) continue

    const checkInTime = ci.checkin_time ? format(new Date(ci.checkin_time), 'h:mm a') : '—'
    const checkOutTime = ci.checkout_time ? format(new Date(ci.checkout_time), 'h:mm a') : '—'
    const date = format(new Date(ci.checkin_time || ci.created_at), 'EEEE, MMMM d, yyyy')

    for (const fm of familyMembers) {
      const familyUser = (fm.user as any)
      if (!familyUser?.email) continue

      await sendEmail({
        to: familyUser.email,
        subject: `Visit Summary: ${clientName} — ${date}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Visit Summary</h2>
            <p>Hi ${familyUser.full_name},</p>
            <p><strong>${caregiverName}</strong> completed a visit with <strong>${clientName}</strong> today.</p>

            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Check-in:</strong> ${checkInTime}</p>
              <p><strong>Check-out:</strong> ${checkOutTime}</p>
              ${ci.evv_verified ? '<p style="color: #16a34a;">✓ GPS/EVV Verified</p>' : ''}
            </div>

            ${visitNote?.notes ? `
            <div style="margin: 16px 0;">
              <h3 style="color: #374151;">Care Notes</h3>
              <p style="color: #6b7280;">${visitNote.notes}</p>
            </div>
            ` : ''}

            ${visitNote?.vitals ? `
            <div style="background: #eff6ff; border-radius: 8px; padding: 12px; margin: 12px 0;">
              <strong>Vitals:</strong> ${visitNote.vitals}
            </div>
            ` : ''}

            ${visitNote?.medications_given ? `
            <div style="margin: 12px 0;">
              <strong>Medications Given:</strong> ${visitNote.medications_given}
            </div>
            ` : ''}

            <p style="color: #9ca3af; font-size: 12px;">
              Sent by Mirinate Care · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/family">View Portal</a>
            </p>
          </div>
        `,
      })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
