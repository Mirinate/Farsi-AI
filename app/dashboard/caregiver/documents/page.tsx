import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { formatDate, isExpiringSoon, isExpired } from '@/lib/utils'
import { FileText, ExternalLink } from 'lucide-react'
import { DocumentUploadButton } from '@/components/caregiver/DocumentUploadButton'

const DOC_LABELS: Record<string, string> = {
  license: 'License',
  bg_check: 'Background Check',
  tb_test: 'TB Test',
  i9: 'I-9',
}

export default async function CaregiverDocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('agency_id').eq('id', user!.id).single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader
        title="My Documents"
        subtitle="Upload and manage your compliance documents"
        action={<DocumentUploadButton userId={user!.id} agencyId={profile!.agency_id} />}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Document</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Expiry Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents?.map(doc => {
              const exp = doc.expiry_date && isExpired(doc.expiry_date)
              const soon = doc.expiry_date && !exp && isExpiringSoon(doc.expiry_date)
              return (
                <tr key={doc.id} className={exp ? 'bg-red-50' : soon ? 'bg-amber-50' : ''}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{DOC_LABELS[doc.type] || doc.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      label={exp ? 'Expired' : soon ? 'Expiring Soon' : doc.status}
                      variant={exp ? 'red' : soon ? 'yellow' : doc.status === 'approved' ? 'green' : 'gray'}
                    />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {doc.expiry_date ? formatDate(doc.expiry_date) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
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
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
