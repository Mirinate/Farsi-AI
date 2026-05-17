import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/resend'

// Called by a cron job every 5-10 minutes
// Also can be called manually: POST /api/alerts/no-show
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  // Find shifts that started 30+ min ago with status 'scheduled' (no check-in)
  const { data: overdueShifts } = await supabase
    .from('shifts')
    .select('*, caregiver:caregivers(user:users(full_name, email)), client:clients(full_name)')
    .eq('status', 'scheduled')
    .lt('start_time', thirtyMinutesAgo.toISOString())
    .gt('start_time', new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()) // last 4 hours only

  if (!overdueShifts || overdueShifts.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let created = 0

  for (const shift of overdueShifts) {
    // Check if alert already exists for this shift
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('agency_id', shift.agency_id)
      .eq('type', 'no_show')
      .contains('message', shift.id)
      .maybeSingle()

    if (existingAlert) continue

    const caregiverName = (shift.caregiver as any)?.user?.full_name || 'Unknown'
    const clientName = (shift.client as any)?.full_name || 'Unknown'

    // Create alert
    await supabase.from('alerts').insert({
      agency_id: shift.agency_id,
      type: 'no_show',
      message: `No-show: ${caregiverName} has not checked in for their shift with ${clientName} (shift ID: ${shift.id})`,
      severity: 'critical',
      resolved: false,
    })

    // Update shift status
    await supabase.from('shifts').update({ status: 'no_show' }).eq('id', shift.id)

    // Increment no-show count
    await supabase.rpc('increment_no_show', { caregiver_id: shift.caregiver_id })

    // Email agency admins
    const { data: admins } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('agency_id', shift.agency_id)
      .eq('role', 'admin')

    for (const admin of admins || []) {
      await sendEmail({
        to: admin.email,
        subject: `🚨 No-Show Alert: ${caregiverName}`,
        html: `
          <h2>No-Show Alert</h2>
          <p>Caregiver <strong>${caregiverName}</strong> did not check in for their scheduled shift with <strong>${clientName}</strong>.</p>
          <p>Shift was scheduled to start at ${new Date(shift.start_time).toLocaleString()}.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/alerts">View Alerts</a></p>
        `,
      })
    }

    created++
  }

  return NextResponse.json({ processed: created })
}
