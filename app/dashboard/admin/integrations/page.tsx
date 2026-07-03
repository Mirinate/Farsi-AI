import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { GHLSettingsForm } from '@/components/admin/GHLSettingsForm'
import { Plug } from 'lucide-react'

export default async function IntegrationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()
  const { data: agency } = await supabase.from('agencies').select('ghl_api_key, ghl_location_id').eq('id', profile!.agency_id).single()

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <PageHeader title="Integrations" subtitle="Connect third-party tools to your agency dashboard" />

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Plug size={18} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">CRM & Marketing</h2>
        </div>
        <GHLSettingsForm ghlApiKey={agency?.ghl_api_key} ghlLocationId={agency?.ghl_location_id} />
      </section>
    </div>
  )
}
