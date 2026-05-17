'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

export function EVVExportButton({ agencyId }: { agencyId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    const res = await fetch('/api/evv/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agencyId }),
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evv-report-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <Download size={16} />
      {loading ? 'Exporting…' : 'Export EVV CSV'}
    </button>
  )
}
