import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/resend'
import { addDays, isBefore, isAfter } from 'date-fns'

// Run daily — finds documents expiring within 30 days
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const in30Days = addDays(now, 30)

  const { data: expiringDocs } = await supabase
    .from('documents')
    .select('*, user:users(full_name, email, agency_id)')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', in30Days.toISOString())
    .gte('expiry_date', now.toISOString())
    .neq('status', 'expired')

  if (!expiringDocs || expiringDocs.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let created = 0

  for (const doc of expiringDocs) {
    const userProfile = doc.user as any
    const agencyId = userProfile?.agency_id
    if (!agencyId) continue

    // Check for existing alert
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('type', 'expiring_document')
      .contains('message', doc.id)
      .maybeSingle()

    if (existing) continue

    const daysLeft = Math.ceil((new Date(doc.expiry_date!).getTime() - now.getTime()) / 86400000)
    const docTypeLabels: Record<string, string> = { license: 'License', bg_check: 'Background Check', tb_test: 'TB Test', i9: 'I-9' }
    const docTypeLabel = docTypeLabels[doc.type] || doc.type

    await supabase.from('alerts').insert({
      agency_id: agencyId,
      type: 'expiring_document',
      message: `${userProfile?.full_name}'s ${docTypeLabel} expires in ${daysLeft} days (doc ID: ${doc.id})`,
      severity: daysLeft <= 7 ? 'critical' : 'warning',
      resolved: false,
    })

    // Mark as expiring soon in documents table
    await supabase.from('documents').update({ status: 'expired' }).eq('id', doc.id).lt('expiry_date', now.toISOString())

    // Notify admins
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('agency_id', agencyId)
      .eq('role', 'admin')

    for (const admin of admins || []) {
      await sendEmail({
        to: admin.email,
        subject: `⚠️ Document Expiring: ${userProfile?.full_name} — ${docTypeLabel}`,
        html: `
          <h2>Document Expiring Soon</h2>
          <p><strong>${userProfile?.full_name}</strong>'s <strong>${docTypeLabel}</strong> expires in <strong>${daysLeft} days</strong>.</p>
          <p>Please request an updated document from the caregiver.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/documents">View Documents</a></p>
        `,
      })
    }

    created++
  }

  return NextResponse.json({ processed: created })
}
