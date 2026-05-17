'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

interface Props {
  moduleId: string
  caregiverId: string
  agencyId: string
}

export function CompleteModuleButton({ moduleId, caregiverId, agencyId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const complete = async () => {
    setLoading(true)
    await supabase.from('training_progress').upsert({
      agency_id: agencyId,
      module_id: moduleId,
      caregiver_id: caregiverId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'module_id,caregiver_id' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={complete}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
    >
      <CheckCircle size={14} />
      {loading ? 'Saving…' : 'Mark Complete'}
    </button>
  )
}
