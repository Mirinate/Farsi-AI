import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDate, getInitials } from '@/lib/utils'
import { Star, AlertCircle } from 'lucide-react'
import { InviteUserButton } from '@/components/admin/InviteUserButton'

export default async function CaregiversPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: caregivers } = await supabase
    .from('caregivers')
    .select('*, user:users(*)')
    .eq('agency_id', profile!.agency_id)
    .order('created_at', { ascending: false })

  // Get shift hours per caregiver (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: shifts } = await supabase
    .from('shifts')
    .select('caregiver_id, start_time, end_time')
    .eq('agency_id', profile!.agency_id)
    .eq('status', 'completed')
    .gte('start_time', thirtyDaysAgo)

  const hoursMap: Record<string, number> = {}
  shifts?.forEach(s => {
    const hrs = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3600000
    hoursMap[s.caregiver_id] = (hoursMap[s.caregiver_id] || 0) + hrs
  })

  return (
    <div className="p-8">
      <PageHeader
        title="Caregivers"
        subtitle={`${caregivers?.length || 0} total caregivers`}
        action={<InviteUserButton role="caregiver" />}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Caregiver</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Certification</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Hours (30d)</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rating</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">No-Shows</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Hire Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {caregivers?.map((cg) => (
              <tr key={cg.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold shrink-0">
                      {cg.user?.full_name ? getInitials(cg.user.full_name) : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cg.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{cg.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {cg.certification ? (
                    <Badge label={cg.certification} variant="blue" />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    label={cg.status}
                    variant={cg.status === 'active' ? 'green' : 'gray'}
                    dot
                  />
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-700">{Math.round(hoursMap[cg.id] || 0)}h</span>
                </td>
                <td className="px-5 py-4">
                  {cg.rating ? (
                    <span className="flex items-center gap-1 text-sm text-gray-700">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      {Number(cg.rating).toFixed(1)}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-5 py-4">
                  {cg.no_show_count > 0 ? (
                    <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                      <AlertCircle size={14} />
                      {cg.no_show_count}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">0</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">
                    {cg.hire_date ? formatDate(cg.hire_date) : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!caregivers || caregivers.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No caregivers yet</p>
            <p className="text-sm mt-1">Invite your first caregiver to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
