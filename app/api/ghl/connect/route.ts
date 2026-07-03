import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ghl_api_key, ghl_location_id } = await req.json()

  if (!ghl_api_key || !ghl_location_id) {
    return NextResponse.json({ error: 'API key and Location ID are required' }, { status: 400 })
  }

  // Test the GHL connection
  const testRes = await fetch(`https://services.leadconnectorhq.com/locations/${ghl_location_id}`, {
    headers: {
      Authorization: `Bearer ${ghl_api_key}`,
      Version: '2021-07-28',
    },
  })

  if (!testRes.ok) {
    return NextResponse.json({ error: 'Invalid API key or Location ID. Please check your credentials.' }, { status: 400 })
  }

  const location = await testRes.json()

  // Save to agency
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  await supabase.from('agencies')
    .update({ ghl_api_key, ghl_location_id })
    .eq('id', profile!.agency_id)

  return NextResponse.json({ success: true, location_name: location.location?.name })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  await supabase.from('agencies')
    .update({ ghl_api_key: null, ghl_location_id: null })
    .eq('id', profile!.agency_id)

  return NextResponse.json({ success: true })
}
