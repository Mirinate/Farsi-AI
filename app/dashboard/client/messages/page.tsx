import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { MessageThreads } from '@/components/shared/MessageThreads'

export default async function ClientMessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('*').eq('id', user!.id).single()

  const { data: agencyUsers } = await supabase
    .from('users')
    .select('*')
    .eq('agency_id', profile!.agency_id)
    .neq('id', user!.id)
    .eq('role', 'admin')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(full_name, role), recipient:users!messages_recipient_id_fkey(full_name, role)')
    .eq('agency_id', profile!.agency_id)
    .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader title="Messages" subtitle="Communicate with your care agency" />
      <MessageThreads
        currentUser={profile}
        agencyUsers={agencyUsers || []}
        messages={messages || []}
        agencyId={profile!.agency_id}
      />
    </div>
  )
}
