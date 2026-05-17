'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

interface Application {
  id: string
  full_name: string
  email: string
  phone: string | null
  certification: string | null
  experience_years: number | null
  status: ApplicationStatus
  created_at: string
  job?: { title: string } | null
}

const COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'bg-blue-50 border-blue-200' },
  { status: 'interview', label: 'Interview', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'bg_check', label: 'Bg Check', color: 'bg-purple-50 border-purple-200' },
  { status: 'hired', label: 'Hired', color: 'bg-green-50 border-green-200' },
]

export function HiringKanban({ applications }: { applications: Application[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [selected, setSelected] = useState<Application | null>(null)

  const moveApplication = async (id: string, status: ApplicationStatus) => {
    await supabase.from('applications').update({ status }).eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const apps = applications.filter(a => a.status === col.status)
          return (
            <div key={col.status} className={`rounded-xl border ${col.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {apps.length}
                </span>
              </div>
              <div className="space-y-2">
                {apps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-semibold text-gray-900">{app.full_name}</p>
                    {app.job?.title && (
                      <p className="text-xs text-blue-600 mt-0.5">{app.job.title}</p>
                    )}
                    {app.certification && (
                      <p className="text-xs text-gray-500 mt-0.5">{app.certification}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(app.created_at)}</p>
                  </div>
                ))}
                {apps.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No applicants</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Application Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Applicant Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{selected.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Applied For</p>
                <p className="text-sm text-gray-700">{selected.job?.title || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Email</p>
                <a href={`mailto:${selected.email}`} className="text-sm text-blue-600 hover:underline">{selected.email}</a>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Phone</p>
                <p className="text-sm text-gray-700">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Certification</p>
                <p className="text-sm text-gray-700">{selected.certification || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Experience</p>
                <p className="text-sm text-gray-700">{selected.experience_years != null ? `${selected.experience_years} years` : '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Move to Stage</p>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map(col => (
                  <button
                    key={col.status}
                    onClick={() => { moveApplication(selected.id, col.status); setSelected(null) }}
                    disabled={selected.status === col.status}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                  >
                    {col.label}
                  </button>
                ))}
                <button
                  onClick={() => { moveApplication(selected.id, 'rejected'); setSelected(null) }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
