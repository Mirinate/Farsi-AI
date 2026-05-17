import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgencyProvider } from '@/components/shared/AgencyProvider'
import { Sidebar } from '@/components/shared/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check agency plan
  const { data: profile } = await supabase
    .from('users')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: agency } = await supabase
    .from('agencies')
    .select('plan, trial_ends_at')
    .eq('id', profile.agency_id)
    .single()

  return (
    <AgencyProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AgencyProvider>
  )
}
