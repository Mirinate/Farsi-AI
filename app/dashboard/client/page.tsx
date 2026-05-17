import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate, formatTime } from '@/lib/utils'
import { Heart, Calendar, User, Phone } from 'lucide-react'

export default async function ClientDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*').eq('id', user!.id).single()

  // Find client record linked to this user (via family_members or direct client user)
  // Client user may have their own record, or be mapped directly
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .limit(1)
    .maybeSingle()

  const now = new Date()
  const { data: upcomingShifts } = await supabase
    .from('shifts')
    .select('*, caregiver:caregivers(user:users(full_name, phone))')
    .eq('client_id', clientRecord?.id || '')
    .gte('start_time', now.toISOString())
    .order('start_time')
    .limit(5)

  const nextShift = upcomingShifts?.[0]

  return (
    <div className="p-8">
      <PageHeader
        title={`Hello, ${profile?.full_name?.split(' ')[0]}`}
        subtitle="Your care plan and upcoming visits"
      />

      {/* Care Plan Summary */}
      {clientRecord && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={18} className="text-red-400" />
              <h2 className="font-semibold text-gray-900">My Care Plan</h2>
            </div>
            <div className="space-y-2">
              {clientRecord.care_type && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Care Type</p>
                  <p className="text-sm text-gray-800">{clientRecord.care_type}</p>
                </div>
              )}
              {clientRecord.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-800">{clientRecord.notes}</p>
                </div>
              )}
              {clientRecord.address && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Care Location</p>
                  <p className="text-sm text-gray-800">{clientRecord.address}</p>
                </div>
              )}
            </div>
          </div>

          {nextShift && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-blue-600" />
                <h2 className="font-semibold text-blue-800">Next Visit</h2>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-1">
                {formatDate(nextShift.start_time, 'EEEE, MMM d')}
              </p>
              <p className="text-sm text-blue-700">
                {formatTime(nextShift.start_time)} – {formatTime(nextShift.end_time)}
              </p>
              {(nextShift.caregiver as any)?.user?.full_name && (
                <div className="flex items-center gap-2 mt-3 text-blue-700">
                  <User size={14} />
                  <p className="text-sm font-medium">{(nextShift.caregiver as any)?.user?.full_name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Visits List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Upcoming Visits</h2>
          <a href="/dashboard/client/visits" className="text-sm text-blue-600 hover:underline">Visit history</a>
        </div>
        <div className="divide-y divide-gray-50">
          {upcomingShifts?.map(shift => (
            <div key={shift.id} className="flex items-center gap-4 p-4">
              <div className="text-center w-12 shrink-0">
                <p className="text-xs font-semibold text-gray-500">{formatDate(shift.start_time, 'EEE')}</p>
                <p className="text-xl font-bold text-gray-900">{formatDate(shift.start_time, 'd')}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{(shift.caregiver as any)?.user?.full_name}</p>
                <p className="text-xs text-gray-500">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
              </div>
            </div>
          ))}
          {(!upcomingShifts || upcomingShifts.length === 0) && (
            <p className="text-sm text-gray-400 p-4 text-center">No upcoming visits scheduled</p>
          )}
        </div>
      </div>
    </div>
  )
}
