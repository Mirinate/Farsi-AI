import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is superadmin
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Only superadmins can update platform settings' },
      { status: 403 }
    )
  }

  const { platformName, platformBrandColor, platformLogoUrl } = await request.json()

  const admin = createAdminClient()

  try {
    // Update or create platform settings
    const { data: existing } = await admin
      .from('platform_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Update existing
      const { error } = await admin
        .from('platform_settings')
        .update({
          platform_name: platformName,
          platform_brand_color: platformBrandColor,
          platform_logo_url: platformLogoUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) throw new Error(`Failed to update settings: ${error.message}`)
    } else {
      // Create new
      const { error } = await admin
        .from('platform_settings')
        .insert({
          platform_name: platformName,
          platform_brand_color: platformBrandColor,
          platform_logo_url: platformLogoUrl || null,
        })

      if (error) throw new Error(`Failed to create settings: ${error.message}`)
    }

    return NextResponse.json(
      { success: true, message: 'Platform settings updated' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
