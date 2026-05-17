'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Upload, Eye } from 'lucide-react'
import type { Agency } from '@/types'

const PRESET_COLORS = [
  '#2563eb', '#7c3aed', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#64748b',
]

export function BrandingSettingsForm({ agency }: { agency: Agency }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(agency.name)
  const [color, setColor] = useState(agency.brand_color)
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${agency.id}/logo.${ext}`

    const { error, data } = await supabase.storage
      .from('agency-logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (!error) {
      const { data: urlData } = supabase.storage.from('agency-logos').getPublicUrl(path)
      setLogoUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    await supabase
      .from('agencies')
      .update({ name, brand_color: color, logo_url: logoUrl || null })
      .eq('id', agency.id)

    // Apply color immediately
    document.documentElement.style.setProperty('--brand-color', color)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Agency Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agency Display Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Shown on dashboards, emails, and the sidebar</p>
      </div>

      {/* Brand Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
          />
          <div className="flex gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <span className="text-sm font-mono text-gray-600">{color}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Used for buttons, highlights, and accent elements throughout the platform</p>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Agency Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={64} height={64} className="rounded-xl object-contain border border-gray-200 p-1 bg-white" />
          ) : (
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <Upload size={20} className="text-gray-400" />
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB. Recommended: 200×200px</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 mb-3">Sidebar Preview</p>
          <div className="w-48 bg-slate-900 rounded-lg p-3">
            <div className="flex items-center gap-2.5 mb-3">
              {logoUrl ? (
                <Image src={logoUrl} alt="" width={28} height={28} className="rounded-lg bg-white object-contain" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="text-white text-xs font-semibold truncate">{name}</p>
            </div>
            {['Overview', 'Scheduling', 'Caregivers'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs mb-0.5 ${i === 0 ? 'text-white' : 'text-slate-400'}`} style={i === 0 ? { backgroundColor: color } : {}}>
                <div className="w-2 h-2 rounded-sm bg-current opacity-60" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Branding'}
        </button>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
        >
          <Eye size={15} />
          {preview ? 'Hide Preview' : 'Preview'}
        </button>
      </div>
    </form>
  )
}
