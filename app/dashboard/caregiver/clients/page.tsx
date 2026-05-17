import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { MapPin, Phone, FileText } from 'lucide-react'

export default async function CaregiverClientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: caregiver } = await supabase.from('caregivers').select('*').eq('user_id', user!.id).single()

  const { data: shifts } = await supabase
    .from('shifts')
    .select('client_id, client:clients(*)')
    .eq('caregiver_id', caregiver?.id || '')
    .neq('status', 'no_show')

  // Deduplicate clients
  const clientMap = new Map()
  shifts?.forEach(s => {
    if (s.client && !clientMap.has(s.client_id)) {
      clientMap.set(s.client_id, s.client)
    }
  })
  const clients = Array.from(clientMap.values())

  return (
    <div className="p-8">
      <PageHeader title="My Clients" subtitle={`${clients.length} assigned client${clients.length !== 1 ? 's' : ''}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client: any) => (
          <div key={client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
              {client.care_type && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{client.care_type}</span>
              )}
            </div>

            {client.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                <MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" />
                <span className="text-xs">{client.address}</span>
              </div>
            )}

            {client.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{client.notes}</p>
                </div>
              </div>
            )}

            {(client.emergency_contact_name || client.emergency_contact_phone) && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Emergency Contact</p>
                <p className="text-xs text-gray-700">{client.emergency_contact_name}</p>
                {client.emergency_contact_phone && (
                  <a href={`tel:${client.emergency_contact_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                    <Phone size={11} />
                    {client.emergency_contact_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No clients assigned yet</p>
          <p className="text-sm mt-1">Your admin will assign you to clients via the schedule</p>
        </div>
      )}
    </div>
  )
}
