import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { AlertTriangle, Bell, Info, CheckCircle } from 'lucide-react'
import { ResolveAlertButton } from '@/components/admin/ResolveAlertButton'

export default async function AlertsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('agency_id', profile!.agency_id)
    .order('created_at', { ascending: false })

  const open = alerts?.filter(a => !a.resolved) || []
  const resolved = alerts?.filter(a => a.resolved) || []

  return (
    <div className="p-8">
      <PageHeader
        title="Alerts"
        subtitle={`${open.length} unresolved alert${open.length !== 1 ? 's' : ''}`}
      />

      {open.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mb-6">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="text-green-800 font-semibold">All clear! No open alerts.</p>
        </div>
      )}

      {open.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Open Alerts</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {open.map((alert) => {
              const Icon = alert.severity === 'critical' ? AlertTriangle : alert.severity === 'warning' ? Bell : Info
              return (
                <div key={alert.id} className="flex items-start gap-4 p-4">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-100' :
                    alert.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <Icon size={16} className={
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(alert.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      label={alert.severity}
                      variant={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'yellow' : 'blue'}
                      dot
                    />
                    <ResolveAlertButton alertId={alert.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm opacity-75">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Resolved ({resolved.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {resolved.slice(0, 20).map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 p-4">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 line-through">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(alert.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
