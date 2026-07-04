'use client'

import { useState } from 'react'
import { Sparkles, Trash2, Loader2 } from 'lucide-react'

export function SeedDemoButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function seed() {
    setLoading(true)
    setStatus(null)
    const res = await fetch('/api/demo/seed', { method: 'POST' })
    const data = await res.json()
    setStatus(data.message || data.error)
    setLoading(false)
    if (res.ok) setTimeout(() => window.location.reload(), 1200)
  }

  async function clear() {
    if (!confirm('Clear all demo data? This cannot be undone.')) return
    setLoading(true)
    setStatus(null)
    const res = await fetch('/api/demo/seed', { method: 'DELETE' })
    const data = await res.json()
    setStatus(data.message || data.error)
    setLoading(false)
    if (res.ok) setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900">Demo Data</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Load sample clients, caregivers, shifts, alerts, and training modules to explore the platform.
      </p>
      {status && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-3">{status}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={seed}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Load Demo Data
        </button>
        <button
          onClick={clear}
          disabled={loading}
          className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          Clear Data
        </button>
      </div>
    </div>
  )
}
