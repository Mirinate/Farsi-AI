'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'

interface Props {
  ghlApiKey?: string | null
  ghlLocationId?: string | null
}

export function GHLSettingsForm({ ghlApiKey, ghlLocationId }: Props) {
  const isConnected = !!(ghlApiKey && ghlLocationId)
  const [apiKey, setApiKey] = useState('')
  const [locationId, setLocationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/ghl/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghl_api_key: apiKey, ghl_location_id: locationId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error })
      } else {
        setStatus({ type: 'success', message: `Connected to "${data.location_name}" successfully!` })
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setStatus({ type: 'error', message: 'Connection failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Go High Level? This will remove your API credentials.')) return
    setLoading(true)
    await fetch('/api/ghl/connect', { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src="https://assets.cdn.filesafe.space/8NZMkUoVo8MvPjFuWKjd/media/62e37a93b6e28a1b3a98fbb0.png" alt="GHL" className="h-6 w-auto" onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <h3 className="font-semibold text-gray-900">Go High Level</h3>
            <p className="text-xs text-gray-500">Sync contacts, pipelines & conversations</p>
          </div>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} /> Connected
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <p><span className="font-medium">Location ID:</span> {ghlLocationId}</p>
            <p className="mt-1"><span className="font-medium">API Key:</span> ••••••••{ghlApiKey?.slice(-4)}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`https://app.gohighlevel.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Open GHL <ExternalLink size={12} />
            </a>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="text-sm text-red-600 hover:underline ml-auto"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your Go High Level credentials to sync your CRM data with this dashboard.{' '}
            <a href="https://help.gohighlevel.com/support/solutions/articles/48001060325" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              How to find your API key →
            </a>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location ID</label>
            <input
              type="text"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              placeholder="ve9EPM428h8vShlRW1KT"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {status && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Connecting...' : 'Connect Go High Level'}
          </button>
        </form>
      )}
    </div>
  )
}
