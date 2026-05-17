import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDateTime } from '@/lib/utils'
import { FileText, Activity } from 'lucide-react'

export default async function FamilyVisitsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('client_id')
    .eq('user_id', user!.id)
    .single()

  const { data: visitNotes } = await supabase
    .from('visit_notes')
    .select('*, caregiver:caregivers(user:users(full_name))')
    .eq('client_id', familyMember?.client_id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader title="Visit Summaries" subtitle={`${visitNotes?.length || 0} visits recorded`} />

      <div className="space-y-4">
        {visitNotes?.map(note => (
          <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{(note.caregiver as any)?.user?.full_name}</p>
                <p className="text-sm text-gray-500">{formatDateTime(note.created_at)}</p>
              </div>
            </div>

            {note.notes && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Care Notes</span>
                </div>
                <p className="text-sm text-gray-700">{note.notes}</p>
              </div>
            )}

            {note.vitals && (
              <div className="mb-3 bg-blue-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity size={14} className="text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700 uppercase">Vitals</span>
                </div>
                <p className="text-sm text-blue-800">{note.vitals}</p>
              </div>
            )}

            {note.medications_given && (
              <div className="bg-amber-50 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-amber-700 uppercase">Medications</span>
                <p className="text-sm text-amber-800 mt-0.5">{note.medications_given}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {(!visitNotes || visitNotes.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No visit summaries yet</p>
        </div>
      )}
    </div>
  )
}
