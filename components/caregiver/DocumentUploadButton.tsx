'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Upload } from 'lucide-react'

interface Props {
  userId: string
  agencyId: string
}

export function DocumentUploadButton({ userId, agencyId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ type: 'license', expiry_date: '' })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${agencyId}/${userId}/${form.type}-${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type })
    if (storageError) { setError(storageError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: dbError } = await supabase.from('documents').insert({
      agency_id: agencyId,
      user_id: userId,
      type: form.type,
      file_url: urlData.publicUrl,
      expiry_date: form.expiry_date || null,
      status: 'pending',
    })

    if (dbError) { setError(dbError.message); setUploading(false); return }

    setOpen(false)
    setFile(null)
    setUploading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Upload size={16} />
        Upload Document
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="license">License</option>
              <option value="bg_check">Background Check</option>
              <option value="tb_test">TB Test</option>
              <option value="i9">I-9</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={e => setForm({ ...form, expiry_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
