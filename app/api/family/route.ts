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

  const { fullName, email, password, phone, clientId, relationship } = await request.json()

  if (!fullName || !email || !password || !clientId)
    return NextResponse.json({ error: 'Name, email, password and client are required' }, { status: 400 })

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Create users row
  const { error: userError } = await admin.from('users').insert({
    id: authData.user.id,
    agency_id: profile.agency_id,
    email,
    role: 'family',
    full_name: fullName,
    phone: phone || null,
  })
  if (userError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // Create family_members row
  const { error: famError } = await admin.from('family_members').insert({
    agency_id: profile.agency_id,
    user_id: authData.user.id,
    client_id: clientId,
    relationship: relationship || null,
  })
  if (famError) {
    await admin.from('users').delete().eq('id', authData.user.id)
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: famError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
