import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, User } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default async function FamilySchedulePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('client_id')
    .eq('user_id', user!.id)
    .single()

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, caregiver:caregivers(user:users(full_name))')
    .eq('client_id', familyMember?.client_id || '')
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(30)

  const statusBadge: Record<string, 'blue' | 'green' | 'gray' | 'red'> = {
    scheduled: 'blue',
    checked_in: 'green',
    completed: 'gray',
    no_show: 'red',
  }

  return (
    <div className="p-8">
      <PageHeader title="Upcoming Schedule" subtitle="Next 30 visits for your loved one" />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {shifts?.map(shift => (
          <div key={shift.id} className="flex items-center gap-5 p-4">
            <div className="text-center w-14 shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase">{formatDate(shift.start_time, 'EEE')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatDate(shift.start_time, 'd')}</p>
              <p className="text-xs text-gray-400">{formatDate(shift.start_time, 'MMM')}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <User size={14} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{(shift.caregiver as any)?.user?.full_name}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              </div>
            </div>
            <Badge label={shift.status.replace('_', ' ')} variant={statusBadge[shift.status] || 'gray'} />
          </div>
        ))}
      </div>

      {(!shifts || shifts.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No upcoming visits scheduled</p>
        </div>
      )}
    </div>
  )
}
