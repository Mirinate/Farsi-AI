import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDateTime } from '@/lib/utils'
import { Activity, FileText } from 'lucide-react'

export default async function ClientVisitsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id')
    .eq('agency_id', profile!.agency_id)
    .maybeSingle()

  const { data: visitNotes } = await supabase
    .from('visit_notes')
    .select('*, caregiver:caregivers(user:users(full_name))')
    .eq('client_id', clientRecord?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader title="Visit History" subtitle={`${visitNotes?.length || 0} visits recorded`} />
      <div className="space-y-4">
        {visitNotes?.map(note => (
          <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-medium text-gray-900 mb-1">{(note.caregiver as any)?.user?.full_name}</p>
            <p className="text-sm text-gray-500 mb-3">{formatDateTime(note.created_at)}</p>
            {note.notes && <p className="text-sm text-gray-700 mb-2">{note.notes}</p>}
            {note.vitals && (
              <p className="text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg">
                <span className="font-medium">Vitals:</span> {note.vitals}
              </p>
            )}
          </div>
        ))}
      </div>
      {(!visitNotes || visitNotes.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <Activity size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No visits recorded yet</p>
        </div>
      )}
    </div>
  )
}
