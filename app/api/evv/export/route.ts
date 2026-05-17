import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('agency_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { agencyId, startDate, endDate } = await req.json()

  const query = supabase
    .from('checkins')
    .select(`
      *,
      caregiver:caregivers(user:users(full_name, email)),
      shift:shifts(start_time, end_time, client:clients(full_name, address))
    `)
    .eq('agency_id', agencyId || profile.agency_id)
    .order('checkin_time', { ascending: false })

  if (startDate) query.gte('checkin_time', startDate)
  if (endDate) query.lte('checkin_time', endDate)

  const { data: checkins } = await query

  // Build CSV
  const headers = [
    'Date',
    'Caregiver Name',
    'Caregiver Email',
    'Client Name',
    'Client Address',
    'Scheduled Start',
    'Scheduled End',
    'Check-In Time',
    'Check-Out Time',
    'Check-In Lat',
    'Check-In Lng',
    'Check-Out Lat',
    'Check-Out Lng',
    'EVV Verified',
  ]

  const rows = checkins?.map(ci => {
    const caregiver = (ci.caregiver as any)?.user
    const shift = ci.shift as any
    const client = shift?.client

    const fmt = (d: string | null) => d ? format(new Date(d), 'yyyy-MM-dd HH:mm:ss') : ''

    return [
      ci.checkin_time ? format(new Date(ci.checkin_time), 'yyyy-MM-dd') : '',
      caregiver?.full_name || '',
      caregiver?.email || '',
      client?.full_name || '',
      client?.address || '',
      shift?.start_time ? fmt(shift.start_time) : '',
      shift?.end_time ? fmt(shift.end_time) : '',
      fmt(ci.checkin_time),
      fmt(ci.checkout_time),
      ci.checkin_lat || '',
      ci.checkin_lng || '',
      ci.checkout_lat || '',
      ci.checkout_lng || '',
      ci.evv_verified ? 'Yes' : 'No',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  }) || []

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="evv-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  })
}
