'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UploadCloudIcon, LinkIcon, FileVideoIcon } from 'lucide-react'

const MAX_FILE_BYTES = 500 * 1024 * 1024
type Mode = 'upload' | 'youtube'

export function UploadForm({ minutesRemaining, userId }: { minutesRemaining: number; userId: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [title, setTitle] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'queuing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setFile(accepted[0]) }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'video/*': [] }, maxSize: MAX_FILE_BYTES, multiple: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (minutesRemaining <= 0) { setErrorMsg('No minutes remaining. Please upgrade your plan.'); return }
    if (mode === 'upload' && !file) { setErrorMsg('Please select a video file.'); return }
    if (mode === 'youtube' && !youtubeUrl) { setErrorMsg('Please enter a YouTube URL.'); return }

    try {
      setStatus('uploading')
      let fileUrl: string | null = null

      if (mode === 'upload' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', userId)
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 80))
        })
        fileUrl = await new Promise<string>((resolve, reject) => {
          xhr.open('POST', '/api/upload')
          xhr.onload = () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).url)
            else reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'))
          }
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(formData)
        })
      }

      setProgress(85)
      setStatus('queuing')

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || (file?.name ?? youtubeUrl),
          sourceType: mode === 'upload' ? 'upload' : 'youtube',
          sourceUrl: mode === 'youtube' ? youtubeUrl : fileUrl,
          userId,
        }),
      })

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to queue job')
      const { jobId } = await res.json()
      setProgress(100)
      setStatus('done')
      setTimeout(() => router.push(`/editor/${jobId}`), 800)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
      setProgress(0)
    }
  }

  const busy = status === 'uploading' || status === 'queuing'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex rounded-lg border border-white/10 p-1 gap-1">
        {(['upload', 'youtube'] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn('flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
              mode === m ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}>
            {m === 'upload' ? <UploadCloudIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            {m === 'upload' ? 'Upload file' : 'YouTube URL'}
          </button>
        ))}
      </div>

      {mode === 'upload' && (
        <div {...getRootProps()} className={cn(
          'rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-violet-500 bg-violet-600/5' : 'border-white/10 hover:border-white/20',
          file && 'border-green-600/40 bg-green-600/5'
        )}>
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileVideoIcon className="w-8 h-8 text-green-400" />
              <p className="font-medium text-green-400">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloudIcon className="w-8 h-8 text-zinc-500" />
              <p className="text-zinc-300">Drag & drop your video here</p>
              <p className="text-xs text-zinc-500">or click to browse — MP4, MOV, AVI up to 500MB</p>
            </div>
          )}
        </div>
      )}

      {mode === 'youtube' && (
        <Input id="youtube" label="YouTube URL" type="url" placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
      )}

      <Input id="title" label="Job title (optional)" type="text" placeholder={file?.name ?? 'My video'}
        value={title} onChange={e => setTitle(e.target.value)} />

      {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

      {busy && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">{status === 'uploading' ? 'Uploading…' : 'Queuing job…'}</span>
            <span className="tabular-nums text-zinc-400">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Job queued! Redirecting to transcript editor…
        </div>
      )}

      <Button type="submit" loading={busy} disabled={busy || status === 'done' || minutesRemaining <= 0} size="lg" className="w-full">
        {minutesRemaining <= 0 ? 'No minutes remaining — upgrade plan' : 'Start dubbing'}
      </Button>
    </form>
  )
}
