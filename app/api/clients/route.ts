import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('agency_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { fullName, dob, address, careType, notes, emergencyContactName, emergencyContactPhone,
    createLogin, email, password } = await request.json()

  if (!fullName) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const admin = createAdminClient()

  // 1. Create client record
  const { data: clientRow, error: clientError } = await admin
    .from('clients')
    .insert({
      agency_id: profile.agency_id,
      full_name: fullName,
      dob: dob || null,
      address: address || null,
      care_type: careType || null,
      notes: notes || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
    })
    .select().single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  // 2. Optionally create portal login
  if (createLogin && email && password) {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    const { error: userError } = await admin.from('users').insert({
      id: authData.user.id,
      agency_id: profile.agency_id,
      email,
      role: 'client',
      full_name: fullName,
    })
    if (userError) {
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, client: clientRow }, { status: 201 })
}
