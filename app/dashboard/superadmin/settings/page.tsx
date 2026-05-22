import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { UpdatePlatformSettingsButton } from '@/components/superadmin/UpdatePlatformSettingsButton'

export default async function PlatformSettingsPage() {
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

  // Fetch platform settings
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single()

  return (
    <div className="p-8">
      <PageHeader
        title="Platform Settings"
        subtitle="Manage platform-wide configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Branding Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {settings?.platform_name || 'Mirinate Care Platform'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Color
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: settings?.platform_brand_color || '#6366f1' }}
                  />
                  <code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                    {settings?.platform_brand_color || '#6366f1'}
                  </code>
                </div>
              </div>

              <UpdatePlatformSettingsButton settings={settings} />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Require 2FA for superadmin login</p>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Configure
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Audit Logs</p>
                  <p className="text-sm text-gray-600">View all platform activity and changes</p>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View Logs
                </button>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">API & Integration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Keys
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Manage API keys for integrations
                </p>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Manage API Keys
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Platform Info</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Version: 1.0.0</li>
              <li>• Database: Supabase</li>
              <li>• Hosting: Vercel</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h4 className="font-semibold text-amber-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-left text-sm font-medium text-amber-900 hover:bg-amber-100 rounded-lg transition-colors">
                Export All Data
              </button>
              <button className="w-full px-4 py-2 text-left text-sm font-medium text-amber-900 hover:bg-amber-100 rounded-lg transition-colors">
                System Health Check
              </button>
              <button className="w-full px-4 py-2 text-left text-sm font-medium text-amber-900 hover:bg-amber-100 rounded-lg transition-colors">
                Backup Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
