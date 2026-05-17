'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, LogIn, LogOut, AlertCircle } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface Shift {
  id: string
  start_time: string
  end_time: string
  status: string
  client_id: string
  client?: { full_name: string; address: string } | null
}

interface CheckIn {
  id: string
  shift_id: string
  checkin_time: string | null
  checkout_time: string | null
}

interface Props {
  caregiver: { id: string }
  agencyId: string
  todayShifts: Shift[]
  activeCheckin: CheckIn | null
  activeShift: Shift | null
}

export function GPSCheckIn({ caregiver, agencyId, todayShifts, activeCheckin, activeShift }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [selectedShiftId, setSelectedShiftId] = useState(todayShifts[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'located' | 'denied'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by this browser'))
        return
      }
      setGpsStatus('locating')
      navigator.geolocation.getCurrentPosition(
        pos => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          setGpsStatus('located')
          resolve(c)
        },
        err => {
          setGpsStatus('denied')
          reject(new Error(`GPS error: ${err.message}`))
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const handleCheckIn = async () => {
    if (!selectedShiftId) { setError('Please select a shift'); return }
    setLoading(true)
    setError(null)

    try {
      const location = await getLocation()

      const { error: err } = await supabase.from('checkins').insert({
        agency_id: agencyId,
        shift_id: selectedShiftId,
        caregiver_id: caregiver.id,
        checkin_time: new Date().toISOString(),
        checkin_lat: location.lat,
        checkin_lng: location.lng,
        evv_verified: true,
      })

      if (err) throw err

      // Update shift status
      await supabase.from('shifts').update({ status: 'checked_in' }).eq('id', selectedShiftId)

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to check in')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!activeCheckin || !activeShift) return
    setLoading(true)
    setError(null)

    try {
      const location = await getLocation()

      await supabase.from('checkins').update({
        checkout_time: new Date().toISOString(),
        checkout_lat: location.lat,
        checkout_lng: location.lng,
        evv_verified: true,
      }).eq('id', activeCheckin.id)

      await supabase.from('shifts').update({ status: 'completed' }).eq('id', activeShift.id)

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to check out')
    } finally {
      setLoading(false)
    }
  }

  const isCheckedIn = !!activeCheckin && !activeCheckin.checkout_time

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={20} className={isCheckedIn ? 'text-green-500' : 'text-gray-400'} />
        <h2 className="font-semibold text-gray-900">GPS Location</h2>
        {gpsStatus === 'locating' && <span className="text-xs text-blue-600">Locating…</span>}
        {gpsStatus === 'located' && coords && (
          <span className="text-xs text-green-600">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
        {gpsStatus === 'denied' && <span className="text-xs text-red-600">GPS access denied</span>}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isCheckedIn ? (
        <div className="space-y-4">
          {/* Shift Selector */}
          {todayShifts.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Shift</label>
              <select
                value={selectedShiftId}
                onChange={e => setSelectedShiftId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {todayShifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {(s.client as any)?.full_name} — {formatTime(s.start_time)} to {formatTime(s.end_time)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {todayShifts.length === 1 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium">{(todayShifts[0].client as any)?.full_name}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatTime(todayShifts[0].start_time)} – {formatTime(todayShifts[0].end_time)}
              </p>
            </div>
          )}

          {todayShifts.length === 0 && (
            <p className="text-sm text-gray-500">No shifts scheduled for today.</p>
          )}

          <button
            onClick={handleCheckIn}
            disabled={loading || todayShifts.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
          >
            <LogIn size={24} />
            {loading ? 'Checking In…' : 'Check In'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            This will record your GPS location for EVV compliance
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">You are checked in</p>
            <p className="text-sm text-green-600 mt-1">
              At {(activeShift?.client as any)?.full_name} since {activeCheckin?.checkin_time ? formatTime(activeCheckin.checkin_time) : '—'}
            </p>
          </div>

          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
          >
            <LogOut size={24} />
            {loading ? 'Checking Out…' : 'Check Out'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            GPS will be recorded at checkout for EVV verification
          </p>
        </div>
      )}
    </div>
  )
}
