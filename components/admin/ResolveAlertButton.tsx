'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'

export function ResolveAlertButton({ alertId }: { alertId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const resolve = async () => {
    setLoading(true)
    await supabase.from('alerts').update({ resolved: true }).eq('id', alertId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors disabled:opacity-50"
    >
      <CheckCircle size={14} />
      Resolve
    </button>
  )
}
