import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { userId, email, fullName, agencyName, subdomain } = await request.json()

  if (!userId || !email || !agencyName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Create agency
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .insert({
      name: agencyName,
      subdomain: subdomain || agencyName.toLowerCase().replace(/\s+/g, '-'),
      brand_color: '#2563eb',
      plan: 'trial',
    })
    .select()
    .single()

  if (agencyError) {
    return NextResponse.json({ error: agencyError.message }, { status: 500 })
  }

  // Create user profile
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      agency_id: agency.id,
      email,
      role: 'admin',
      full_name: fullName || '',
    })

  if (userError) {
    // Rollback agency
    await supabase.from('agencies').delete().eq('id', agency.id)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ agency }, { status: 201 })
}
