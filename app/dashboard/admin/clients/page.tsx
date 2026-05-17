import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/utils'
import { Phone, MapPin, Plus } from 'lucide-react'
import { AddClientButton } from '@/components/admin/AddClientButton'
import { InviteUserButton } from '@/components/admin/InviteUserButton'

export default async function ClientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', profile!.agency_id)
    .order('full_name')

  // Get assigned caregivers per client
  const { data: shifts } = await supabase
    .from('shifts')
    .select('client_id, caregiver:caregivers(user:users(full_name))')
    .eq('agency_id', profile!.agency_id)
    .eq('status', 'scheduled')

  const caregiverMap: Record<string, string> = {}
  shifts?.forEach(s => {
    if (!caregiverMap[s.client_id]) {
      caregiverMap[s.client_id] = (s.caregiver as any)?.user?.full_name || ''
    }
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Clients"
        subtitle={`${clients?.length || 0} clients enrolled`}
        action={<AddClientButton agencyId={profile!.agency_id} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients?.map((client) => (
          <div key={client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                {client.dob && (
                  <p className="text-xs text-gray-500 mt-0.5">DOB: {formatDate(client.dob)}</p>
                )}
              </div>
              {client.care_type && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {client.care_type}
                </span>
              )}
            </div>

            {client.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                <MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" />
                <span className="text-xs">{client.address}</span>
              </div>
            )}

            {caregiverMap[client.id] && (
              <div className="text-xs text-gray-500 mb-2">
                <span className="font-medium">Assigned:</span> {caregiverMap[client.id]}
              </div>
            )}

            {(client.emergency_contact_name || client.emergency_contact_phone) && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Emergency Contact</p>
                <p className="text-xs text-gray-700">{client.emergency_contact_name}</p>
                {client.emergency_contact_phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Phone size={11} />
                    {client.emergency_contact_phone}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(!clients || clients.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No clients yet</p>
          <p className="text-sm mt-1">Add your first client to get started</p>
        </div>
      )}
    </div>
  )
}
