import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, sourceType, sourceUrl } = await req.json()
  if (!title || !sourceType || !sourceUrl)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({ user_id: user.id, title, status: 'queued', source_type: sourceType, source_url: sourceUrl })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  triggerPipeline(job.id, sourceUrl, sourceType).catch(console.error)
  return NextResponse.json({ jobId: job.id })
}

async function triggerPipeline(jobId: string, sourceUrl: string, sourceType: string) {
  const pipelineUrl = process.env.PIPELINE_API_URL
  if (!pipelineUrl) return
  await fetch(`${pipelineUrl}/dub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.PIPELINE_API_KEY ?? '' },
    body: JSON.stringify({ job_id: jobId, source_url: sourceUrl, source_type: sourceType }),
  })
}
