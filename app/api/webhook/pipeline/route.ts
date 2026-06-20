import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.PIPELINE_API_KEY)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, status, output_video_url, output_srt_url, duration_seconds, segments, error_message } = await req.json()
  if (!job_id || !status)
    return NextResponse.json({ error: 'Missing job_id or status' }, { status: 400 })

  const update: Record<string, unknown> = { status }
  if (output_video_url) update.output_video_url = output_video_url
  if (output_srt_url) update.output_srt_url = output_srt_url
  if (duration_seconds) update.duration_seconds = duration_seconds
  if (segments) update.segments = segments
  if (error_message) update.error_message = error_message

  const { error } = await supabaseAdmin.from('jobs').update(update).eq('id', job_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'done' && duration_seconds) {
    const { data: jobRow } = await supabaseAdmin.from('jobs').select('user_id').eq('id', job_id).single()
    if (jobRow) {
      await supabaseAdmin.rpc('increment_minutes_used' as never, {
        p_user_id: (jobRow as { user_id: string }).user_id,
        p_seconds: duration_seconds,
      } as never)
    }
  }

  return NextResponse.json({ ok: true })
}
