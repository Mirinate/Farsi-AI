import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  void req
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', user.id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  await supabase.from('jobs').update({ status: 'queued' }).eq('id', jobId)

  const pipelineUrl = process.env.PIPELINE_API_URL
  if (pipelineUrl) {
    fetch(`${pipelineUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.PIPELINE_API_KEY ?? '' },
      body: JSON.stringify({ job_id: jobId, segments: job.segments }),
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
