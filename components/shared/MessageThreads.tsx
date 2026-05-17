'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, getInitials } from '@/lib/utils'
import { Send } from 'lucide-react'
import type { User, Message } from '@/types'

interface Props {
  currentUser: User
  agencyUsers: User[]
  messages: (Message & { sender?: User; recipient?: User })[]
  agencyId: string
}

export function MessageThreads({ currentUser, agencyUsers, messages, agencyId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(agencyUsers[0]?.id || null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get unique conversation partners
  const conversationPartners = agencyUsers

  const threadMessages = messages.filter(m =>
    (m.sender_id === currentUser.id && m.recipient_id === selectedUserId) ||
    (m.recipient_id === currentUser.id && m.sender_id === selectedUserId)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const lastMessages: Record<string, Message & { sender?: User }> = {}
  messages.forEach(m => {
    const partnerId = m.sender_id === currentUser.id ? m.recipient_id : m.sender_id
    if (!lastMessages[partnerId] || new Date(m.created_at) > new Date(lastMessages[partnerId].created_at)) {
      lastMessages[partnerId] = m
    }
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages.length])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !selectedUserId) return
    setSending(true)

    await supabase.from('messages').insert({
      agency_id: agencyId,
      sender_id: currentUser.id,
      recipient_id: selectedUserId,
      body: body.trim(),
      read: false,
    })

    setBody('')
    router.refresh()
    setSending(false)
  }

  const selectedUser = agencyUsers.find(u => u.id === selectedUserId)
  const unread = (userId: string) => messages.filter(m => m.sender_id === userId && m.recipient_id === currentUser.id && !m.read).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex h-[600px] overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {conversationPartners.map(u => {
            const last = lastMessages[u.id]
            const unreadCount = unread(u.id)
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedUserId === u.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                  {getInitials(u.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    {unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                  {last && <p className="text-xs text-gray-400 truncate mt-0.5">{last.body}</p>}
                </div>
              </button>
            )
          })}

          {conversationPartners.length === 0 && (
            <p className="text-xs text-gray-400 text-center p-6">No users to message</p>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-semibold">
                {getInitials(selectedUser.full_name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedUser.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{selectedUser.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {threadMessages.map(msg => {
                const isOwn = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${
                      isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                        {formatDateTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Message ${selectedUser.full_name}…`}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
