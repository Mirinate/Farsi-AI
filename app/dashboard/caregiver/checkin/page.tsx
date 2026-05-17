import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { GPSCheckIn } from '@/components/caregiver/GPSCheckIn'
import { VisitNoteForm } from '@/components/caregiver/VisitNoteForm'
import { formatTime } from '@/lib/utils'

export default async function CheckInPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: caregiver } = await supabase.from('caregivers').select('*').eq('user_id', user!.id).single()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const now = new Date()
  const startOfDay = new Date(now).setHours(0, 0, 0, 0)

  // Get today's scheduled shifts
  const { data: todayShifts } = await supabase
    .from('shifts')
    .select('*, client:clients(full_name, address)')
    .eq('caregiver_id', caregiver?.id || '')
    .in('status', ['scheduled', 'checked_in'])
    .gte('start_time', new Date(startOfDay).toISOString())
    .order('start_time')

  // Get today's check-in records
  const { data: todayCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('caregiver_id', caregiver?.id || '')
    .gte('created_at', new Date(startOfDay).toISOString())

  const activeShift = todayShifts?.find(s => s.status === 'checked_in')
  const activeCheckin = todayCheckins?.find(c => c.checkin_time && !c.checkout_time)

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader
        title="Check In / Out"
        subtitle="GPS-verified electronic visit verification (EVV)"
      />

      {/* Current Active Shift */}
      {activeShift && activeCheckin && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <p className="font-semibold text-green-800">Currently Checked In</p>
          </div>
          <p className="text-sm text-green-700">
            At <span className="font-medium">{(activeShift.client as any)?.full_name}</span> since {formatTime(activeCheckin.checkin_time!)}
          </p>
        </div>
      )}

      {/* GPS Check-In Component */}
      <GPSCheckIn
        caregiver={caregiver!}
        agencyId={profile!.agency_id}
        todayShifts={todayShifts || []}
        activeCheckin={activeCheckin || null}
        activeShift={activeShift || null}
      />

      {/* Visit Note Form (shown when checked in) */}
      {activeShift && activeCheckin && (
        <div className="mt-6">
          <VisitNoteForm
            shiftId={activeShift.id}
            caregiverId={caregiver!.id}
            clientId={activeShift.client_id}
            agencyId={profile!.agency_id}
          />
        </div>
      )}
    </div>
  )
}
