import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('agency_id, role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const agencyId = profile.agency_id
  const now = new Date()

  // Seed clients
  const { data: clients } = await supabase.from('clients').insert([
    { agency_id: agencyId, full_name: 'Eleanor Whitfield', dob: '1938-04-12', address: '842 Maple St, San Diego, CA', care_type: 'personal_care', notes: 'Needs assistance with bathing and medication. Allergic to penicillin.', emergency_contact_name: 'Robert Whitfield', emergency_contact_phone: '619-555-0101' },
    { agency_id: agencyId, full_name: 'George Martinez', dob: '1942-09-28', address: '317 Ocean View Dr, San Diego, CA', care_type: 'companionship', notes: 'Enjoys reading and chess. Has mild dementia. Keep routine consistent.', emergency_contact_name: 'Linda Martinez', emergency_contact_phone: '619-555-0102' },
    { agency_id: agencyId, full_name: 'Dorothy Chen', dob: '1935-01-05', address: '124 Palm Ave, Chula Vista, CA', care_type: 'skilled_nursing', notes: 'Diabetic. Requires daily blood sugar monitoring. Low-sodium diet.', emergency_contact_name: 'Kevin Chen', emergency_contact_phone: '619-555-0103' },
    { agency_id: agencyId, full_name: 'Harold Johnson', dob: '1940-07-19', address: '56 Rosewood Ln, El Cajon, CA', care_type: 'personal_care', notes: 'Wheelchair user. Needs transfers and mobility assistance.', emergency_contact_name: 'Susan Johnson', emergency_contact_phone: '619-555-0104' },
  ]).select()

  // Seed caregivers (users already exist as demo, just add caregiver profiles)
  const { data: caregiverUsers } = await supabase.from('users')
    .select('id').eq('agency_id', agencyId).eq('role', 'caregiver')

  const caregiverIds: string[] = []
  if (caregiverUsers && caregiverUsers.length > 0) {
    for (const u of caregiverUsers) {
      const { data: cg } = await supabase.from('caregivers').upsert({
        agency_id: agencyId,
        user_id: u.id,
        certification: 'CNA',
        hire_date: '2025-01-15',
        status: 'active',
        no_show_count: 0,
        rating: 4.8,
      }, { onConflict: 'user_id' }).select()
      if (cg?.[0]) caregiverIds.push(cg[0].id)
    }
  }

  // Seed shifts for the next 7 days
  if (clients && clients.length > 0 && caregiverIds.length > 0) {
    const shifts = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(now)
      date.setDate(now.getDate() + day)

      for (let i = 0; i < Math.min(clients.length, 3); i++) {
        const start = new Date(date)
        start.setHours(8 + i * 3, 0, 0, 0)
        const end = new Date(start)
        end.setHours(start.getHours() + 2)

        shifts.push({
          agency_id: agencyId,
          caregiver_id: caregiverIds[i % caregiverIds.length],
          client_id: clients[i].id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: day === 0 ? 'completed' : 'scheduled',
          repeat: 'daily',
        })
      }
    }
    await supabase.from('shifts').insert(shifts)
  }

  // Seed alerts
  await supabase.from('alerts').insert([
    { agency_id: agencyId, type: 'missed_checkin', message: 'Caregiver Maria Garcia missed check-in for Eleanor Whitfield at 8:00 AM', severity: 'high', resolved: false },
    { agency_id: agencyId, type: 'certification_expiry', message: 'CNA certification for James Wilson expires in 30 days', severity: 'medium', resolved: false },
    { agency_id: agencyId, type: 'incident_report', message: 'Minor fall reported at George Martinez\'s residence — no injury', severity: 'high', resolved: true },
  ])

  // Seed training modules
  await supabase.from('training_modules').insert([
    { agency_id: agencyId, title: 'HIPAA Compliance Basics', description: 'Understanding patient privacy and data protection requirements.', duration_minutes: 45, required: true },
    { agency_id: agencyId, title: 'Fall Prevention & Safety', description: 'Techniques to prevent falls and respond to incidents.', duration_minutes: 60, required: true },
    { agency_id: agencyId, title: 'Dementia Care Fundamentals', description: 'Best practices for caring for clients with dementia.', duration_minutes: 90, required: false },
    { agency_id: agencyId, title: 'Medication Management', description: 'Safe handling and documentation of client medications.', duration_minutes: 30, required: true },
  ])

  // Seed job postings
  await supabase.from('job_postings').insert([
    { agency_id: agencyId, title: 'Full-Time CNA', description: 'Looking for a certified nursing assistant for morning shifts in San Diego.', requirements: 'Active CNA license, 1+ year experience, reliable transportation', status: 'open' },
    { agency_id: agencyId, title: 'Part-Time Home Health Aide', description: 'Weekend shifts available for experienced home health aides.', requirements: 'HHA certification, CPR certified, background check', status: 'open' },
  ])

  return NextResponse.json({ success: true, message: 'Demo data seeded successfully!' })
}

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('agency_id, role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const agencyId = profile.agency_id
  await Promise.all([
    supabase.from('shifts').delete().eq('agency_id', agencyId),
    supabase.from('alerts').delete().eq('agency_id', agencyId),
    supabase.from('clients').delete().eq('agency_id', agencyId),
    supabase.from('training_modules').delete().eq('agency_id', agencyId),
    supabase.from('job_postings').delete().eq('agency_id', agencyId),
  ])

  return NextResponse.json({ success: true, message: 'Demo data cleared.' })
}
