import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TranscriptEditor } from '@/components/editor/transcript-editor'
import type { TranscriptSegment } from '@/types/database'

export default async function EditorPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: job } = await supabase
    .from('jobs').select('*').eq('id', jobId).eq('user_id', user.id).single()

  if (!job) notFound()

  const segments = (job.segments ?? []) as TranscriptSegment[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-zinc-400 text-sm mt-1">Edit Farsi segments below, then render the final video.</p>
        </div>
        <TranscriptEditor jobId={jobId} initialSegments={segments} jobStatus={job.status} />
      </main>
    </div>
  )
}
