'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { UserPlus } from 'lucide-react'
import type { UserRole } from '@/types'

interface InviteUserButtonProps {
  role: Exclude<UserRole, 'admin'>
  clientId?: string
}

export function InviteUserButton({ role, clientId }: InviteUserButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role, clientId }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Failed to send invite')
    } else {
      setSuccess(true)
      setEmail('')
      setFullName('')
      router.refresh()
    }
    setLoading(false)
  }

  const labels: Record<string, string> = {
    caregiver: 'Caregiver',
    client: 'Client',
    family: 'Family Member',
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(null) }}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <UserPlus size={16} />
        Invite {labels[role]}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Invite ${labels[role]}`} size="sm">
        {success ? (
          <div className="text-center py-6">
            <div className="text-green-600 text-4xl mb-3">✓</div>
            <p className="font-semibold text-gray-900">Invite sent!</p>
            <p className="text-sm text-gray-500 mt-1">They&apos;ll receive a magic link to complete their profile.</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
