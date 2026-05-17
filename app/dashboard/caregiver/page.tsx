import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock } from 'lucide-react'

export default async function CaregiverDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*, agency:agencies(name, brand_color)').eq('id', user!.id).single()
  const { data: caregiver } = await supabase.from('caregivers').select('*').eq('user_id', user!.id).single()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, client:clients(full_name, address, care_type)')
    .eq('caregiver_id', caregiver?.id || '')
    .gte('start_time', startOfWeek.toISOString())
    .lte('start_time', endOfWeek.toISOString())
    .order('start_time')

  const todayShifts = shifts?.filter(s => {
    const d = new Date(s.start_time)
    return d.toDateString() === now.toDateString()
  }) || []

  const upcomingShifts = shifts?.filter(s => new Date(s.start_time) > now) || []

  const statusBadge: Record<string, 'blue' | 'green' | 'gray' | 'red'> = {
    scheduled: 'blue',
    checked_in: 'green',
    completed: 'gray',
    no_show: 'red',
  }

  return (
    <div className="p-8">
      <PageHeader
        title={`Hello, ${profile?.full_name?.split(' ')[0] || 'Caregiver'}`}
        subtitle={`${todayShifts.length} shift${todayShifts.length !== 1 ? 's' : ''} today`}
      />

      {/* Today's Shifts */}
      {todayShifts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Today</h2>
          <div className="space-y-3">
            {todayShifts.map(shift => (
              <div key={shift.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{(shift.client as any)?.full_name || 'Unknown Client'}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{(shift.client as any)?.address}</p>
                    </div>
                    <Badge label={shift.status.replace('_', ' ')} variant={statusBadge[shift.status] || 'gray'} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <Clock size={14} className="text-gray-400" />
                    {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                    {(shift.client as any)?.care_type && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {(shift.client as any)?.care_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest of the Week */}
      {upcomingShifts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming This Week</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {upcomingShifts.map(shift => (
              <div key={shift.id} className="flex items-center gap-4 p-4">
                <div className="text-center w-12 shrink-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{formatDate(shift.start_time, 'EEE')}</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(shift.start_time, 'd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{(shift.client as any)?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
                </div>
                <Badge label={shift.status.replace('_', ' ')} variant={statusBadge[shift.status] || 'gray'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(!shifts || shifts.length === 0) && (
        <div className="text-center py-20 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No shifts this week</p>
          <p className="text-sm mt-1">Check back when your admin schedules you</p>
        </div>
      )}
    </div>
  )
}
