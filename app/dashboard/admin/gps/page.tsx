import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime, formatTime } from '@/lib/utils'
import { MapPin, CheckCircle, XCircle, Download } from 'lucide-react'
import { EVVExportButton } from '@/components/admin/EVVExportButton'

export default async function GPSPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: checkins } = await supabase
    .from('checkins')
    .select(`
      *,
      caregiver:caregivers(id, user:users(full_name, email)),
      shift:shifts(start_time, end_time, client:clients(full_name, address))
    `)
    .eq('agency_id', profile!.agency_id)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  const evvCompliant = checkins?.filter(c => c.evv_verified).length || 0
  const total = checkins?.length || 0
  const pct = total > 0 ? Math.round((evvCompliant / total) * 100) : 100

  return (
    <div className="p-8">
      <PageHeader
        title="GPS Check-In / EVV"
        subtitle="Today's electronic visit verification"
        action={<EVVExportButton agencyId={profile!.agency_id} />}
      />

      {/* EVV Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Check-ins Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{evvCompliant}</p>
          <p className="text-sm text-gray-500 mt-1">EVV Verified</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-5 text-center ${pct >= 90 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-3xl font-bold ${pct >= 90 ? 'text-green-700' : 'text-red-700'}`}>{pct}%</p>
          <p className="text-sm text-gray-500 mt-1">EVV Compliance Rate</p>
        </div>
      </div>

      {/* Check-in Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Today&apos;s Check-ins</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Caregiver</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Check In</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Check Out</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">GPS</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">EVV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {checkins?.map(ci => (
                <tr key={ci.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{(ci.caregiver as any)?.user?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{(ci.caregiver as any)?.user?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-700">{(ci.shift as any)?.client?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{(ci.shift as any)?.client?.address}</p>
                  </td>
                  <td className="px-5 py-4">
                    {ci.checkin_time ? (
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{formatTime(ci.checkin_time)}</p>
                        {ci.checkin_lat && (
                          <a
                            href={`https://maps.google.com/?q=${ci.checkin_lat},${ci.checkin_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                          >
                            <MapPin size={11} /> View map
                          </a>
                        )}
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    {ci.checkout_time ? (
                      <p className="text-sm text-gray-900 font-medium">{formatTime(ci.checkout_time)}</p>
                    ) : (
                      ci.checkin_time ? (
                        <Badge label="In Progress" variant="green" dot />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {ci.checkin_lat ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-gray-300" />
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      label={ci.evv_verified ? 'Verified' : 'Pending'}
                      variant={ci.evv_verified ? 'green' : 'yellow'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!checkins || checkins.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <MapPin size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No check-ins today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
