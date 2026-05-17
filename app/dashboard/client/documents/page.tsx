import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate } from '@/lib/utils'
import { FileText, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default async function ClientDocumentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader title="My Documents" subtitle="Your care-related documents" />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {documents?.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 p-4">
            <FileText size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 capitalize">{doc.type.replace('_', ' ')}</p>
              {doc.expiry_date && <p className="text-xs text-gray-400">Expires {formatDate(doc.expiry_date)}</p>}
            </div>
            <Badge label={doc.status} variant={doc.status === 'approved' ? 'green' : doc.status === 'expired' ? 'red' : 'gray'} />
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink size={13} />
              View
            </a>
          </div>
        ))}
        {(!documents || documents.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-12">No documents yet</p>
        )}
      </div>
    </div>
  )
}
