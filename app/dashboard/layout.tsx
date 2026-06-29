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

  // Don't redirect to login if profile is missing — that causes a redirect loop.
  // The individual pages will handle missing profiles.
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Setting up your account…</p>
          <p className="text-sm text-gray-400 mt-1">Please refresh in a moment.</p>
        </div>
      </div>
    )
  }

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
