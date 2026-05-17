'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Plus } from 'lucide-react'

export function AddJobButton({ agencyId }: { agencyId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    certification_required: '',
    pay_rate: '',
    employment_type: 'Full-time',
    description: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('job_postings').insert({
      agency_id: agencyId,
      title: form.title,
      certification_required: form.certification_required || null,
      pay_rate: form.pay_rate ? parseFloat(form.pay_rate) : null,
      employment_type: form.employment_type,
      description: form.description || null,
      status: 'open',
    })
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Post Job
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Post a Job" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="CNA – Part Time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification Required</label>
              <select
                value={form.certification_required}
                onChange={e => setForm({ ...form, certification_required: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="CNA">CNA</option>
                <option value="HHA">HHA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Rate ($/hr)</label>
              <input
                type="number"
                step="0.01"
                value={form.pay_rate}
                onChange={e => setForm({ ...form, pay_rate: e.target.value })}
                placeholder="18.50"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
            <select
              value={form.employment_type}
              onChange={e => setForm({ ...form, employment_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Per Diem</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Posting…' : 'Post Job'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
