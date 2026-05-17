import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { WeeklyScheduler } from '@/components/admin/WeeklyScheduler'

export default async function SchedulingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const agencyId = profile!.agency_id

  // Get current week range
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const [
    { data: shifts },
    { data: caregivers },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from('shifts')
      .select('*, caregiver:caregivers(id, user:users(full_name)), client:clients(id, full_name)')
      .eq('agency_id', agencyId)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time'),
    supabase.from('caregivers').select('id, user:users(full_name)').eq('agency_id', agencyId).eq('status', 'active'),
    supabase.from('clients').select('id, full_name').eq('agency_id', agencyId),
  ])

  return (
    <div className="p-8">
      <PageHeader title="Scheduling" subtitle="Weekly caregiver schedule" />
      <WeeklyScheduler
        shifts={shifts || []}
        caregivers={caregivers || []}
        clients={clients || []}
        agencyId={agencyId}
        weekStart={startOfWeek.toISOString()}
      />
    </div>
  )
}
