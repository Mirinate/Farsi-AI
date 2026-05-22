import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Building2, Users, Calendar } from 'lucide-react'
import { CreateAgencyButton } from '@/components/superadmin/CreateAgencyButton'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function SuperAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify user is superadmin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (!profile || profile.role !== 'superadmin') {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Unauthorized access</p>
      </div>
    )
  }

  // Fetch all agencies
  const { data: agencies } = await supabase
    .from('agencies')
    .select(`
      id,
      name,
      subdomain,
      brand_color,
      logo_url,
      plan,
      trial_ends_at,
      created_at,
      users:users(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader
        title="Platform Administration"
        subtitle="Manage all agencies"
        action={<CreateAgencyButton />}
      />

      <div className="grid grid-cols-1 gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Agencies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{agencies?.length || 0}</p>
              </div>
              <Building2 className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {agencies?.filter((a: any) => a.plan === 'active').length || 0}
                </p>
              </div>
              <Calendar className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {agencies?.reduce((sum: number, a: any) => sum + (a.users?.[0]?.count || 0), 0) || 0}
                </p>
              </div>
              <Users className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Trial Agencies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {agencies?.filter((a: any) => a.plan === 'trial').length || 0}
                </p>
              </div>
              <Building2 className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        {/* Agencies List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">All Agencies</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Agency Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Subdomain</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Users</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {agencies?.map((agency: any) => (
                  <tr key={agency.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {agency.logo_url && (
                          <img
                            src={agency.logo_url}
                            alt={agency.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{agency.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {agency.subdomain}.mirinate.com
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          agency.plan === 'active'
                            ? 'bg-green-100 text-green-800'
                            : agency.plan === 'trial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {agency.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {agency.users?.[0]?.count || 0} users
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(agency.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/superadmin/agencies/${agency.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!agencies || agencies.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No agencies yet</p>
              <p className="text-sm mt-1">Create your first agency to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
