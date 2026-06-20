import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { PLANS, formatDate, formatMinutes } from '@/lib/utils'
import { PlusIcon, DownloadIcon, EditIcon } from 'lucide-react'
import type { Job, Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const p = profile as Profile | null
  const plan = PLANS[(p?.plan ?? 'free') as keyof typeof PLANS]
  const minutesUsed = (p?.minutes_used ?? 0) / 60
  const minutesLimit = plan.minutesPerMonth
  const usagePct = Math.min((minutesUsed / minutesLimit) * 100, 100)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">{user.email}</p>
          </div>
          <Link href="/upload"><Button size="md"><PlusIcon className="w-4 h-4" />New dub</Button></Link>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-zinc-400">Plan</p>
              <p className="text-lg font-semibold mt-0.5">{plan.name} — {plan.label}</p>
            </div>
            <Link href="/#pricing"><Button variant="secondary" size="sm">Upgrade</Button></Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Minutes used this month</span>
              <span className="tabular-nums">{minutesUsed.toFixed(1)} / {minutesLimit} min</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${usagePct}%` }} />
            </div>
            {usagePct >= 90 && (
              <p className="text-xs text-amber-400">Running low — <Link href="/#pricing" className="underline">upgrade your plan</Link> for more minutes.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Your dubbing jobs</h2>
          {!jobs || jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-16 text-center">
              <p className="text-zinc-500 mb-4">No jobs yet. Upload a video to get started.</p>
              <Link href="/upload"><Button>Upload your first video</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(jobs as Job[]).map((job) => (
                <div key={job.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{job.title}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-zinc-500">
                      {formatDate(job.created_at)}
                      {job.duration_seconds ? ` · ${formatMinutes(job.duration_seconds)}` : ''}
                    </p>
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-xs text-red-400 mt-1">{job.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === 'done' && (
                      <>
                        {job.output_video_url && (
                          <a href={job.output_video_url} download>
                            <Button variant="secondary" size="sm"><DownloadIcon className="w-3.5 h-3.5" />Video</Button>
                          </a>
                        )}
                        {job.output_srt_url && (
                          <a href={job.output_srt_url} download>
                            <Button variant="ghost" size="sm"><DownloadIcon className="w-3.5 h-3.5" />SRT</Button>
                          </a>
                        )}
                      </>
                    )}
                    {(job.status === 'queued' || job.status === 'processing') && job.segments && (
                      <Link href={`/editor/${job.id}`}>
                        <Button variant="secondary" size="sm"><EditIcon className="w-3.5 h-3.5" />Edit transcript</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
