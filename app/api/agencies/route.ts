import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('users').select('role, agency_id').eq('id', user.id).single()

  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only superadmins can create agencies' }, { status: 403 })
  }

  const {
    agencyName,
    adminFullName,
    adminEmail,
    adminPassword,
    brandColor,
    logoUrl,
    subdomain,
  } = await request.json()

  if (!agencyName || !adminFullName || !adminEmail || !adminPassword || !subdomain) {
    return NextResponse.json(
      { error: 'Agency name, admin name, email, password, and subdomain are required' },
      { status: 400 }
    )
  }

  // Check subdomain is unique
  const { data: existingSubdomain } = await supabase
    .from('agencies')
    .select('id')
    .eq('subdomain', subdomain.toLowerCase())
    .single()

  if (existingSubdomain) {
    return NextResponse.json(
      { error: `Subdomain "${subdomain}" is already taken` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  try {
    // 1. Create the agency
    const { data: agency, error: agencyError } = await admin
      .from('agencies')
      .insert({
        name: agencyName,
        subdomain: subdomain.toLowerCase(),
        brand_color: brandColor || '#2563eb',
        logo_url: logoUrl || null,
      })
      .select()
      .single()

    if (agencyError) throw new Error(`Failed to create agency: ${agencyError.message}`)

    // 2. Create admin auth user for the new agency
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminFullName },
    })

    if (authError) throw new Error(`Failed to create auth user: ${authError.message}`)

    // 3. Create users row for the new admin
    const { error: userError } = await admin.from('users').insert({
      id: authData.user.id,
      agency_id: agency.id,
      email: adminEmail,
      role: 'admin',
      full_name: adminFullName,
    })

    if (userError) {
      await admin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create user profile: ${userError.message}`)
    }

    // 4. Log this action in audit log
    await admin.from('audit_logs').insert({
      superadmin_user_id: user.id,
      action: 'agency_created',
      agency_id: agency.id,
      details: {
        agency_name: agencyName,
        admin_email: adminEmail,
        subdomain: subdomain,
      },
    })

    return NextResponse.json(
      {
        success: true,
        agency: {
          id: agency.id,
          name: agencyName,
          subdomain: subdomain,
          adminEmail: adminEmail,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only superadmins can view agencies' }, { status: 403 })
  }

  // Superadmin can view all agencies
  const { data: agencies, error } = await supabase
    .from('agencies')
    .select(`
      id,
      name,
      subdomain,
      brand_color,
      logo_url,
      plan,
      trial_ends_at,
      created_at,
      users:users(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agencies })
}
