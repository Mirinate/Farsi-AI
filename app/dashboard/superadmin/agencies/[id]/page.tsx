import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/utils'
import { Users, Building2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AgencyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify user is superadmin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (!profile || profile.role !== 'superadmin') {
    return notFound()
  }

  // Fetch agency details
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!agency) {
    return notFound()
  }

  // Fetch agency admin
  const { data: admin } = await supabase
    .from('users')
    .select('*')
    .eq('agency_id', params.id)
    .eq('role', 'admin')
    .single()

  // Fetch agency stats
  const { data: allUsers } = await supabase
    .from('users')
    .select('role')
    .eq('agency_id', params.id)

  const { data: caregivers } = await supabase
    .from('caregivers')
    .select('*', { count: 'exact' })
    .eq('agency_id', params.id)

  const { data: clients } = await supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('agency_id', params.id)

  const stats = {
    totalUsers: allUsers?.length || 0,
    admins: allUsers?.filter(u => u.role === 'admin').length || 0,
    caregivers: caregivers?.length || 0,
    clients: clients?.length || 0,
  }

  const isTrialExpired = agency.plan === 'trial' && new Date(agency.trial_ends_at) < new Date()

  return (
    <div className="p-8">
      <Link
        href="/dashboard/superadmin"
        className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
      >
        ← Back to Agencies
      </Link>

      <PageHeader
        title={agency.name}
        subtitle={`${agency.subdomain}.mirinate.com`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Status</h3>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
                  isTrialExpired
                    ? 'bg-red-100 text-red-800'
                    : agency.plan === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isTrialExpired ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {isTrialExpired ? 'Trial Expired' : agency.plan === 'active' ? 'Active' : 'Trial'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Plan</p>
                <p className="text-sm text-gray-900 font-medium mt-1">{agency.plan}</p>
              </div>

              {agency.plan === 'trial' && (
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                    Trial Ends
                  </p>
                  <p className="text-sm text-gray-900 font-medium mt-1">
                    {formatDate(agency.trial_ends_at)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Created</p>
                <p className="text-sm text-gray-900 font-medium mt-1">
                  {formatDate(agency.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Account */}
          {admin && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Agency Administrator</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Name</p>
                  <p className="text-sm text-gray-900 font-medium mt-1">{admin.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={14} className="text-gray-400" />
                    <a
                      href={`mailto:${admin.email}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {admin.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Branding</h3>
            <div className="space-y-4">
              {agency.logo_url && (
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
                    Logo
                  </p>
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="h-12 object-contain"
                  />
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
                  Brand Color
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: agency.brand_color }}
                  />
                  <code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                    {agency.brand_color}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-blue-900">Total Users</p>
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-purple-900">Admins</p>
              <Building2 size={20} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.admins}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-green-900">Caregivers</p>
              <Users size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.caregivers}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-orange-900">Clients</p>
              <Users size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">{stats.clients}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Link href={`/dashboard/admin?agency=${agency.id}`} className="block w-full border border-blue-600 text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors text-center">
              View Dashboard
            </Link>
            <Link href={`/dashboard/superadmin/agencies/${agency.id}/settings`} className="block w-full border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors text-center">
              Edit Settings
            </Link>
            <button className="w-full border border-red-600 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-50 transition-colors">
              Suspend Agency
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
