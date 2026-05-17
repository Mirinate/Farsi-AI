'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agency, User } from '@/types'

interface AgencyContextValue {
  agency: Agency | null
  profile: User | null
  loading: boolean
  refetch: () => void
}

const AgencyContext = createContext<AgencyContextValue>({
  agency: null,
  profile: null,
  loading: true,
  refetch: () => {},
})

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) { setLoading(false); return }

    setProfile(userProfile)

    const { data: agencyData } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', userProfile.agency_id)
      .single()

    setAgency(agencyData)
    setLoading(false)

    // Apply brand color
    if (agencyData?.brand_color) {
      document.documentElement.style.setProperty('--brand-color', agencyData.brand_color)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <AgencyContext.Provider value={{ agency, profile, loading, refetch: fetch }}>
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  return useContext(AgencyContext)
}
