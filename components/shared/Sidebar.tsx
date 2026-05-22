'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Bell, Briefcase, Users, Calendar, MapPin,
  UserCheck, BookOpen, MessageSquare, FileText, Settings,
  LogOut, ChevronRight, Activity, Heart, Home,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgency } from './AgencyProvider'
import { cn, getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

const adminNav = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/admin/hiring', label: 'Hiring', icon: Briefcase },
  { href: '/dashboard/admin/caregivers', label: 'Caregivers', icon: UserCheck },
  { href: '/dashboard/admin/scheduling', label: 'Scheduling', icon: Calendar },
  { href: '/dashboard/admin/gps', label: 'GPS / EVV', icon: MapPin },
  { href: '/dashboard/admin/clients', label: 'Clients', icon: Heart },
  { href: '/dashboard/admin/training', label: 'Training', icon: BookOpen },
  { href: '/dashboard/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/admin/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
]

const caregiverNav = [
  { href: '/dashboard/caregiver', label: 'My Schedule', icon: Calendar },
  { href: '/dashboard/caregiver/checkin', label: 'Check In / Out', icon: MapPin },
  { href: '/dashboard/caregiver/clients', label: 'My Clients', icon: Heart },
  { href: '/dashboard/caregiver/training', label: 'Training', icon: BookOpen },
  { href: '/dashboard/caregiver/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/caregiver/messages', label: 'Messages', icon: MessageSquare },
]

const familyNav = [
  { href: '/dashboard/family', label: "Today's Status", icon: Activity },
  { href: '/dashboard/family/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/family/visits', label: 'Visit Summaries', icon: FileText },
  { href: '/dashboard/family/messages', label: 'Messages', icon: MessageSquare },
]

const clientNav = [
  { href: '/dashboard/client', label: 'My Care Plan', icon: Home },
  { href: '/dashboard/client/visits', label: 'Visit History', icon: Activity },
  { href: '/dashboard/client/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/client/messages', label: 'Messages', icon: MessageSquare },
]

const superadminNav = [
  { href: '/dashboard/superadmin', label: 'Agencies', icon: Briefcase },
  { href: '/dashboard/superadmin/settings', label: 'Platform Settings', icon: Settings },
]

const navByRole: Record<UserRole | 'superadmin', typeof adminNav> = {
  admin: adminNav,
  caregiver: caregiverNav,
  family: familyNav,
  client: clientNav,
  superadmin: superadminNav,
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { agency, profile } = useAgency()

  const nav = profile?.role ? navByRole[profile.role] : []

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col">
      {/* Agency branding */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {profile?.role === 'superadmin' ? (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-purple-600 to-blue-600">
              M
            </div>
          ) : agency?.logo_url ? (
            <Image
              src={agency.logo_url}
              alt={agency.name}
              width={36}
              height={36}
              className="rounded-lg object-contain bg-white"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: agency?.brand_color || '#2563eb' }}
            >
              {agency?.name ? getInitials(agency.name) : 'MC'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {profile?.role === 'superadmin' ? 'Mirinate Platform' : agency?.name || 'Mirinate Care'}
            </p>
            <p className="text-slate-400 text-xs capitalize">
              {profile?.role === 'superadmin' ? 'Platform Admin' : profile?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={17} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
              {item.label}
              {isActive && <ChevronRight size={14} className="ml-auto text-slate-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {profile?.full_name ? getInitials(profile.full_name) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
