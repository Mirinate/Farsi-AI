import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { BrandingSettingsForm } from '@/components/admin/BrandingSettingsForm'
import { GHLSettingsForm } from '@/components/admin/GHLSettingsForm'
import { InviteUserButton } from '@/components/admin/InviteUserButton'
import { CreditCard, Users, Settings, Plug } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', profile!.agency_id)
    .single()

  const { data: teamMembers } = await supabase
    .from('users')
    .select('*')
    .eq('agency_id', profile!.agency_id)
    .order('role')

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your agency profile and billing" />

      {/* Branding */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">White-Label Branding</h2>
        </div>
        {agency && <BrandingSettingsForm agency={agency} />}
      </section>

      {/* Billing */}
      {/* Integrations */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Plug size={18} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        </div>
        <GHLSettingsForm ghlApiKey={agency?.ghl_api_key} ghlLocationId={agency?.ghl_location_id} />
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Billing & Subscription</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Plan: <span className="font-semibold capitalize">{agency?.plan || 'Trial'}</span>
            </p>
            {agency?.plan === 'trial' && agency.trial_ends_at && (
              <p className="text-xs text-amber-600 mt-1">
                Trial ends {new Date(agency.trial_ends_at).toLocaleDateString()}
              </p>
            )}
            {agency?.plan === 'active' && (
              <p className="text-xs text-green-600 mt-1">$149/month · Active</p>
            )}
          </div>
          <div className="flex gap-3">
            {agency?.plan !== 'active' && (
              <a
                href="/api/stripe/create-checkout"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Upgrade — $149/mo
              </a>
            )}
            {agency?.plan === 'active' && (
              <a
                href="/api/stripe/portal"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Manage Billing
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          </div>
          <div className="flex gap-2">
            <InviteUserButton role="caregiver" />
            <InviteUserButton role="client" />
            <InviteUserButton role="family" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teamMembers?.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{member.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      member.role === 'caregiver' ? 'bg-blue-100 text-blue-700' :
                      member.role === 'client' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
