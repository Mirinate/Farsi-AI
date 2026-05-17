'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, parseISO, isSameDay } from 'date-fns'

interface Shift {
  id: string
  start_time: string
  end_time: string
  status: string
  repeat: string
  caregiver?: { id: string; user?: { full_name: string } | null } | null
  client?: { id: string; full_name: string } | null
}

interface Props {
  shifts: Shift[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caregivers: { id: string; user?: any }[]
  clients: { id: string; full_name: string }[]
  agencyId: string
  weekStart: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const statusColors: Record<string, 'green' | 'blue' | 'yellow' | 'red' | 'gray'> = {
  scheduled: 'blue',
  checked_in: 'green',
  completed: 'gray',
  no_show: 'red',
}

export function WeeklyScheduler({ shifts, caregivers, clients, agencyId, weekStart }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekStartDate = parseISO(weekStart)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i))

  const [form, setForm] = useState({
    caregiver_id: '',
    client_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '16:00',
    repeat: 'none',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const start = new Date(`${form.date}T${form.start_time}`)
    const end = new Date(`${form.date}T${form.end_time}`)

    const { error: err } = await supabase.from('shifts').insert({
      agency_id: agencyId,
      caregiver_id: form.caregiver_id,
      client_id: form.client_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'scheduled',
      repeat: form.repeat,
    })

    if (err) { setError(err.message); setSaving(false); return }

    setAddOpen(false)
    router.refresh()
    setSaving(false)
  }

  return (
    <div>
      {/* Week navigation + add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekStartDate, 'MMM d')} – {format(addDays(weekStartDate, 6), 'MMM d, yyyy')}
          </span>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Shift
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map((day, i) => (
            <div
              key={i}
              className={`px-3 py-3 text-center border-r last:border-r-0 border-gray-100 ${
                isSameDay(day, new Date()) ? 'bg-blue-50' : ''
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">{DAYS[i]}</p>
              <p className={`text-lg font-bold mt-0.5 ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-64">
          {days.map((day, i) => {
            const dayShifts = shifts.filter(s => isSameDay(parseISO(s.start_time), day))
            return (
              <div key={i} className="border-r last:border-r-0 border-gray-100 p-2 space-y-1.5 min-h-32">
                {dayShifts.map(shift => (
                  <div
                    key={shift.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-semibold text-blue-900 truncate">
                      {shift.caregiver?.user?.full_name || 'Unknown'}
                    </p>
                    <p className="text-blue-700 truncate mt-0.5">{shift.client?.full_name || 'Unknown'}</p>
                    <p className="text-blue-500 mt-0.5">
                      {format(parseISO(shift.start_time), 'h:mma')}–{format(parseISO(shift.end_time), 'h:mma')}
                    </p>
                    <div className="mt-1">
                      <Badge label={shift.status.replace('_', ' ')} variant={statusColors[shift.status] || 'gray'} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Shift Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Shift" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver</label>
              <select
                required
                value={form.caregiver_id}
                onChange={e => setForm({ ...form, caregiver_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select caregiver…</option>
                {caregivers.map(c => {
                  const name = Array.isArray(c.user) ? c.user[0]?.full_name : c.user?.full_name
                  return <option key={c.id} value={c.id}>{name || c.id}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                required
                value={form.client_id}
                onChange={e => setForm({ ...form, client_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select client…</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
            <select
              value={form.repeat}
              onChange={e => setForm({ ...form, repeat: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays (Mon–Fri)</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Shift'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
