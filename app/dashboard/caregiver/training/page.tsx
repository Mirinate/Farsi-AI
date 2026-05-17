import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/utils'
import { BookOpen, CheckCircle, Clock } from 'lucide-react'
import { CompleteModuleButton } from '@/components/caregiver/CompleteModuleButton'

export default async function CaregiverTrainingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()
  const { data: caregiver } = await supabase.from('caregivers').select('*').eq('user_id', user!.id).single()

  const [{ data: modules }, { data: progress }] = await Promise.all([
    supabase.from('training_modules').select('*').eq('agency_id', profile!.agency_id),
    supabase.from('training_progress').select('*').eq('caregiver_id', caregiver?.id || ''),
  ])

  const completed = progress?.filter(p => p.completed).length || 0
  const total = modules?.length || 0

  return (
    <div className="p-8">
      <PageHeader
        title="My Training"
        subtitle={`${completed} of ${total} modules completed`}
      />

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-blue-600 transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {modules?.map(mod => {
          const prog = progress?.find(p => p.module_id === mod.id)
          const done = prog?.completed || false

          return (
            <div key={mod.id} className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${done ? 'border-green-100' : 'border-gray-100'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${done ? 'bg-green-50' : 'bg-blue-50'}`}>
                {done ? <CheckCircle size={20} className="text-green-500" /> : <BookOpen size={20} className="text-blue-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${done ? 'text-gray-500' : 'text-gray-900'}`}>{mod.title}</h3>
                      {mod.required && !done && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
                      )}
                    </div>
                    {mod.description && <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>}
                    {mod.due_date && !done && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock size={11} />
                        Due {formatDate(mod.due_date)}
                      </div>
                    )}
                    {done && prog?.completed_at && (
                      <p className="text-xs text-green-600 mt-1">Completed {formatDate(prog.completed_at)}</p>
                    )}
                  </div>
                  {!done && caregiver && (
                    <CompleteModuleButton
                      moduleId={mod.id}
                      caregiverId={caregiver.id}
                      agencyId={profile!.agency_id}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {(!modules || modules.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No training modules assigned</p>
        </div>
      )}
    </div>
  )
}
