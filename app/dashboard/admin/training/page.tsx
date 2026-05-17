import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddModuleButton } from '@/components/admin/AddModuleButton'
import { formatDate } from '@/lib/utils'
import { BookOpen, CheckCircle, Clock } from 'lucide-react'

export default async function TrainingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const [{ data: modules }, { data: caregivers }, { data: progress }] = await Promise.all([
    supabase.from('training_modules').select('*').eq('agency_id', profile!.agency_id).order('created_at', { ascending: false }),
    supabase.from('caregivers').select('id, user:users(full_name)').eq('agency_id', profile!.agency_id).eq('status', 'active'),
    supabase.from('training_progress').select('*').eq('agency_id', profile!.agency_id),
  ])

  return (
    <div className="p-8">
      <PageHeader
        title="Training"
        subtitle={`${modules?.length || 0} training modules`}
        action={<AddModuleButton agencyId={profile!.agency_id} />}
      />

      <div className="space-y-4">
        {modules?.map(mod => {
          const modProgress = progress?.filter(p => p.module_id === mod.id) || []
          const total = caregivers?.length || 0
          const completed = modProgress.filter(p => p.completed).length
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BookOpen size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                      {mod.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Required</span>
                      )}
                    </div>
                    {mod.description && <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>}
                    {mod.due_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock size={11} />
                        Due {formatDate(mod.due_date)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{pct}%</p>
                  <p className="text-xs text-gray-400">{completed}/{total} caregivers</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#2563eb' }}
                />
              </div>

              {/* Caregiver completion list */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {caregivers?.map(cg => {
                  const cgProgress = modProgress.find(p => p.caregiver_id === cg.id)
                  return (
                    <div key={cg.id} className="flex items-center gap-2 text-xs text-gray-600">
                      {cgProgress?.completed ? (
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                      )}
                      <span className="truncate">{(cg.user as any)?.full_name || 'Unknown'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {(!modules || modules.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No training modules yet</p>
          <p className="text-sm mt-1">Add your first module to track caregiver training</p>
        </div>
      )}
    </div>
  )
}
