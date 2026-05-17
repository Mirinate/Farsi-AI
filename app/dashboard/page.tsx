import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This page only renders briefly before middleware redirects by role.
// Shown if middleware somehow misses the role redirect.
export default async function DashboardRoot() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role) {
    redirect(`/dashboard/${profile.role}`)
  }

  // User is authenticated but has no profile — show a holding page
  // instead of redirecting to /login (which would cause a redirect loop)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Setting up your account…</h2>
        <p className="text-gray-500 text-sm">
          Your profile is being configured. Please refresh in a moment, or contact support if this persists.
        </p>
      </div>
    </div>
  )
}
