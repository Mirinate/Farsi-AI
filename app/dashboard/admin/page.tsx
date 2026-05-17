import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Users, UserCheck, Calendar, MapPin, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

async function getOverviewData(agencyId: string) {
  const supabase = createClient()

  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const [
    { count: caregiverCount },
    { count: clientCount },
    { data: todayShifts },
    { data: checkins },
    { data: recentAlerts },
    { data: noShows },
  ] = await Promise.all([
    supabase.from('caregivers').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'active'),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId),
    supabase.from('shifts').select('*').eq('agency_id', agencyId).gte('start_time', startOfDay).lte('start_time', endOfDay),
    supabase.from('checkins').select('*').eq('agency_id', agencyId).gte('checkin_time', startOfDay),
    supabase.from('alerts').select('*').eq('agency_id', agencyId).eq('resolved', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('shifts').select('*').eq('agency_id', agencyId).eq('status', 'no_show').gte('start_time', startOfDay),
  ])

  const totalShifts = todayShifts?.length || 0
  const checkedIn = checkins?.filter(c => c.checkin_time && !c.checkout_time).length || 0
  const evvCompliant = checkins?.filter(c => c.evv_verified).length || 0
  const evvPct = totalShifts > 0 ? Math.round((evvCompliant / totalShifts) * 100) : 100

  return { caregiverCount, clientCount, totalShifts, checkedIn, evvPct, recentAlerts, noShowCount: noShows?.length || 0 }
}

export default async function AdminOverviewPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const data = await getOverviewData(profile!.agency_id)

  const { data: agency } = await supabase.from('agencies').select('brand_color, name, plan, trial_ends_at').eq('id', profile!.agency_id).single()
  const brandColor = agency?.brand_color || '#2563eb'

  return (
    <div className="p-8">
      {/* Trial banner */}
      {agency?.plan === 'trial' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-amber-800 text-sm font-medium">
            You&apos;re on a free trial.
            {agency.trial_ends_at && ` Trial ends ${new Date(agency.trial_ends_at).toLocaleDateString()}.`}
          </p>
          <a href="/api/stripe/create-checkout" className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
            Upgrade Now
          </a>
        </div>
      )}

      <PageHeader
        title={`Good ${getGreeting()}, ${agency?.name || 'Agency'}`}
        subtitle="Here's what's happening today"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Caregivers" value={data.caregiverCount ?? 0} icon={UserCheck} color={brandColor} />
        <StatCard label="Total Clients" value={data.clientCount ?? 0} icon={Users} color={brandColor} />
        <StatCard label="Shifts Today" value={data.totalShifts} icon={Calendar} color={brandColor} />
        <StatCard label="Currently Checked In" value={data.checkedIn} icon={MapPin} color="#10b981" />
        <StatCard label="EVV Compliance" value={`${data.evvPct}%`} icon={TrendingUp} color={data.evvPct >= 90 ? '#10b981' : '#f59e0b'} trend={data.evvPct >= 90 ? 'Within compliance' : 'Below target'} trendUp={data.evvPct >= 90} />
        <StatCard label="No-Shows Today" value={data.noShowCount} icon={AlertTriangle} color={data.noShowCount > 0 ? '#ef4444' : '#10b981'} />
      </div>

      {/* Recent Alerts */}
      {data.recentAlerts && data.recentAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Alerts</h2>
            <a href="/dashboard/admin/alerts" className="text-sm text-blue-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(alert.created_at)}</p>
                </div>
                <Badge
                  label={alert.severity}
                  variant={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'yellow' : 'blue'}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
