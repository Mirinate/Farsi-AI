import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('users')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { email, fullName, role, clientId } = await req.json()

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const agencyId = adminProfile.agency_id

  const { data: agency } = await adminSupabase
    .from('agencies')
    .select('name')
    .eq('id', agencyId)
    .single()

  // Create auth user with invite
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invite?agency=${encodeURIComponent(agency?.name || '')}`,
    data: { full_name: fullName, role, agency_id: agencyId },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Create user record in users table
  const { data: newUser, error: userError } = await adminSupabase
    .from('users')
    .insert({
      id: inviteData.user.id,
      agency_id: agencyId,
      email,
      role,
      full_name: fullName || '',
    })
    .select()
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // For caregivers, create caregiver record
  if (role === 'caregiver') {
    await adminSupabase.from('caregivers').insert({
      agency_id: agencyId,
      user_id: inviteData.user.id,
      status: 'active',
      no_show_count: 0,
    })
  }

  // For family members, link to client
  if (role === 'family' && clientId) {
    await adminSupabase.from('family_members').insert({
      agency_id: agencyId,
      user_id: inviteData.user.id,
      client_id: clientId,
    })
  }

  return NextResponse.json({ success: true, userId: inviteData.user.id })
}
