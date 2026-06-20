import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { UploadForm } from '@/components/upload/upload-form'
import { PLANS } from '@/lib/utils'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const plan = PLANS[(profile?.plan ?? 'free') as keyof typeof PLANS]
  const minutesRemaining = Math.max(0, plan.minutesPerMonth - (profile?.minutes_used ?? 0) / 60)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">New dubbing job</h1>
          <p className="text-zinc-400 text-sm mt-1">{minutesRemaining.toFixed(1)} minutes remaining on {plan.name} plan</p>
        </div>
        <UploadForm minutesRemaining={minutesRemaining} userId={user.id} />
      </main>
    </div>
  )
}
