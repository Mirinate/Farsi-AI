import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDate, isExpiringSoon, isExpired } from '@/lib/utils'
import { FileText, AlertTriangle, ExternalLink } from 'lucide-react'

const DOC_LABELS: Record<string, string> = {
  license: 'License',
  bg_check: 'Background Check',
  tb_test: 'TB Test',
  i9: 'I-9',
}

export default async function DocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, user:users(full_name, email, role)')
    .eq('agency_id', profile!.agency_id)
    .order('expiry_date', { ascending: true })

  const expiring = documents?.filter(d => d.expiry_date && isExpiringSoon(d.expiry_date)) || []
  const expired = documents?.filter(d => d.expiry_date && isExpired(d.expiry_date)) || []

  return (
    <div className="p-8">
      <PageHeader
        title="Documents & Compliance"
        subtitle={`${expiring.length + expired.length} items need attention`}
      />

      {/* Attention Required */}
      {(expired.length > 0 || expiring.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800">Action Required</h3>
          </div>
          <div className="space-y-1">
            {expired.map(d => (
              <p key={d.id} className="text-sm text-amber-700">
                <span className="font-medium">{(d.user as any)?.full_name}</span>&apos;s {DOC_LABELS[d.type]} expired on {formatDate(d.expiry_date!)}
              </p>
            ))}
            {expiring.map(d => (
              <p key={d.id} className="text-sm text-amber-700">
                <span className="font-medium">{(d.user as any)?.full_name}</span>&apos;s {DOC_LABELS[d.type]} expires {formatDate(d.expiry_date!)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Employee</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Document Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Expiry Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents?.map(doc => {
              const expired = doc.expiry_date && isExpired(doc.expiry_date)
              const expiringSoon = doc.expiry_date && !expired && isExpiringSoon(doc.expiry_date)

              return (
                <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${expired ? 'bg-red-50' : expiringSoon ? 'bg-amber-50' : ''}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{(doc.user as any)?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{(doc.user as any)?.role}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{DOC_LABELS[doc.type] || doc.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      label={expired ? 'Expired' : expiringSoon ? 'Expiring Soon' : doc.status}
                      variant={expired ? 'red' : expiringSoon ? 'yellow' : doc.status === 'approved' ? 'green' : 'gray'}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                      {doc.expiry_date ? formatDate(doc.expiry_date) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink size={13} />
                      View
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(!documents || documents.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
