'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TranscriptSegment, JobStatus } from '@/types/database'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toFixed(1).padStart(4, '0')}`
}

export function TranscriptEditor({ jobId, initialSegments, jobStatus }: {
  jobId: string
  initialSegments: TranscriptSegment[]
  jobStatus: JobStatus
}) {
  const [segments, setSegments] = useState(initialSegments)
  const [saving, setSaving] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function updateSegment(id: number, farsi: string) {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, farsi } : s))
    setSaved(false)
  }

  async function saveSegments() {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/jobs/${jobId}/segments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
    } catch { setError('Failed to save segments') }
    finally { setSaving(false) }
  }

  async function renderFinal() {
    setRendering(true); setError('')
    try {
      await saveSegments()
      const res = await fetch(`/api/jobs/${jobId}/render`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start render')
    } catch { setError('Failed to start render') }
    finally { setRendering(false) }
  }

  if (initialSegments.length === 0) return (
    <div className="rounded-xl border border-white/5 p-12 text-center">
      <StatusBadge status={jobStatus} />
      <p className="text-zinc-400 mt-4">
        {jobStatus === 'queued' || jobStatus === 'processing'
          ? 'Transcript is being generated. Refresh once processing completes.'
          : 'No segments available.'}
      </p>
      {(jobStatus === 'queued' || jobStatus === 'processing') && (
        <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>Refresh</Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={jobStatus} />
          <span className="text-sm text-zinc-500">{segments.length} segments</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
          <Button variant="secondary" size="sm" loading={saving} onClick={saveSegments}>Save changes</Button>
          <Button size="sm" loading={rendering} onClick={renderFinal}>Render final video</Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_1fr] text-xs text-zinc-500 uppercase tracking-wide px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <span>Time</span><span>English</span>
          <span className="text-right font-farsi">فارسی</span>
        </div>
        <div className="divide-y divide-white/5">
          {segments.map((seg) => (
            <div key={seg.id} className="grid grid-cols-[80px_1fr_1fr] px-4 py-3 gap-4 hover:bg-white/[0.02] transition-colors">
              <span className="text-xs text-zinc-600 tabular-nums pt-2">{formatTime(seg.start)}</span>
              <p className="text-sm text-zinc-300 pt-1.5 leading-relaxed">{seg.english}</p>
              <textarea
                className={cn(
                  'text-sm text-zinc-100 bg-white/5 rounded-lg border border-white/10 px-3 py-2 resize-none min-h-[60px]',
                  'font-farsi text-right leading-relaxed',
                  'focus:outline-none focus:border-violet-500 transition-colors'
                )}
                dir="rtl" value={seg.farsi} rows={2}
                onChange={e => updateSegment(seg.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" size="sm" loading={saving} onClick={saveSegments}>Save changes</Button>
        <Button size="sm" loading={rendering} onClick={renderFinal}>Render final video</Button>
      </div>
    </div>
  )
}
