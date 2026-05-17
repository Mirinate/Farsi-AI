import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDateTime, formatTime } from '@/lib/utils'
import { CheckCircle, Clock, MapPin, User, Calendar } from 'lucide-react'

export default async function FamilyDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*').eq('id', user!.id).single()

  // Get the client this family member is associated with
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('*, client:clients(*)')
    .eq('user_id', user!.id)
    .single()

  const client = (familyMember?.client as any)

  // Get today's shift for this client
  const now = new Date()
  const startOfDay = new Date(now).setHours(0, 0, 0, 0)

  const { data: todayShifts } = await supabase
    .from('shifts')
    .select('*, caregiver:caregivers(id, user:users(full_name, phone))')
    .eq('client_id', familyMember?.client_id || '')
    .gte('start_time', new Date(startOfDay).toISOString())
    .order('start_time')

  const { data: activeCheckin } = await supabase
    .from('checkins')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .not('checkin_time', 'is', null)
    .is('checkout_time', null)
    .gte('created_at', new Date(startOfDay).toISOString())
    .in('shift_id', todayShifts?.map(s => s.id) || [])
    .maybeSingle()

  // Recent visit notes
  const { data: recentNotes } = await supabase
    .from('visit_notes')
    .select('*, caregiver:caregivers(user:users(full_name))')
    .eq('client_id', familyMember?.client_id || '')
    .order('created_at', { ascending: false })
    .limit(3)

  const todayShift = todayShifts?.[0]
  const caregiverName = (todayShift?.caregiver as any)?.user?.full_name

  return (
    <div className="p-8">
      <PageHeader
        title={`${client?.full_name || 'Your Loved One'}`}
        subtitle="Live care status and updates"
      />

      {/* Live Status Card */}
      <div className={`rounded-xl border-2 p-6 mb-6 ${
        activeCheckin ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-4 h-4 rounded-full ${activeCheckin ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <h2 className={`text-lg font-bold ${activeCheckin ? 'text-green-800' : 'text-gray-600'}`}>
            {activeCheckin ? 'Caregiver Is Here' : 'No Active Visit'}
          </h2>
        </div>

        {activeCheckin && todayShift && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <User size={15} />
              <span className="text-sm font-medium">{caregiverName} arrived at {formatTime(activeCheckin.checkin_time!)}</span>
            </div>
            {activeCheckin.checkin_lat && (
              <div className="flex items-center gap-2 text-green-700">
                <MapPin size={15} />
                <a
                  href={`https://maps.google.com/?q=${activeCheckin.checkin_lat},${activeCheckin.checkin_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                >
                  GPS location verified
                </a>
              </div>
            )}
          </div>
        )}

        {!activeCheckin && todayShift && (
          <div className="text-gray-600">
            <div className="flex items-center gap-2 text-sm">
              <Clock size={15} />
              <span>{caregiverName} is scheduled {formatTime(todayShift.start_time)} – {formatTime(todayShift.end_time)}</span>
            </div>
          </div>
        )}

        {!activeCheckin && !todayShift && (
          <p className="text-gray-500 text-sm">No visits scheduled for today.</p>
        )}
      </div>

      {/* Recent Visit Notes */}
      {recentNotes && recentNotes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Visit Summaries</h2>
            <a href="/dashboard/family/visits" className="text-sm text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNotes.map(note => (
              <div key={note.id} className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={15} className="text-green-500" />
                  <p className="text-sm font-medium text-gray-700">
                    {(note.caregiver as any)?.user?.full_name} — {formatDateTime(note.created_at)}
                  </p>
                </div>
                {note.notes && <p className="text-sm text-gray-600 mb-2">{note.notes}</p>}
                {note.vitals && (
                  <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium">Vitals:</span> {note.vitals}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Schedule */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Upcoming Visits</h2>
          </div>
          <a href="/dashboard/family/schedule" className="text-sm text-blue-600 hover:underline">Full schedule</a>
        </div>
        <div className="divide-y divide-gray-50">
          {todayShifts?.filter(s => new Date(s.start_time) > now).map(shift => (
            <div key={shift.id} className="flex items-center gap-4 p-4">
              <div className="text-center w-12 shrink-0">
                <p className="text-xs font-bold text-gray-500 uppercase">{formatTime(shift.start_time).split(' ')[1]}</p>
                <p className="text-base font-bold text-gray-900">{formatTime(shift.start_time).split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{(shift.caregiver as any)?.user?.full_name}</p>
                <p className="text-xs text-gray-500">Until {formatTime(shift.end_time)}</p>
              </div>
            </div>
          ))}
          {(!todayShifts || todayShifts.filter(s => new Date(s.start_time) > now).length === 0) && (
            <p className="text-sm text-gray-400 p-4">No more visits today</p>
          )}
        </div>
      </div>
    </div>
  )
}
