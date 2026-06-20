import { cn } from '@/lib/utils'
import type { JobStatus } from '@/types/database'

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-zinc-800 text-zinc-300' },
  processing: { label: 'Processing', className: 'bg-blue-600/20 text-blue-400 animate-pulse' },
  done: { label: 'Done', className: 'bg-green-600/20 text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-600/20 text-red-400' },
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
