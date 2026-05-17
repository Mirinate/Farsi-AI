'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText } from 'lucide-react'

interface Props {
  shiftId: string
  caregiverId: string
  clientId: string
  agencyId: string
}

export function VisitNoteForm({ shiftId, caregiverId, clientId, agencyId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    notes: '',
    vitals: '',
    medications_given: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('visit_notes').upsert({
      agency_id: agencyId,
      shift_id: shiftId,
      caregiver_id: caregiverId,
      client_id: clientId,
      notes: form.notes || null,
      vitals: form.vitals || null,
      medications_given: form.medications_given || null,
    }, { onConflict: 'shift_id,caregiver_id' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900">Visit Notes</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Care Notes</label>
          <textarea
            rows={4}
            placeholder="Describe the care provided during this visit…"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vitals</label>
          <input
            type="text"
            placeholder="BP: 120/80, HR: 72, Temp: 98.6°F"
            value={form.vitals}
            onChange={e => setForm({ ...form, vitals: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medications Given</label>
          <input
            type="text"
            placeholder="Metformin 500mg, Lisinopril 10mg"
            value={form.medications_given}
            onChange={e => setForm({ ...form, medications_given: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Visit Notes'}
        </button>
      </form>
    </div>
  )
}
