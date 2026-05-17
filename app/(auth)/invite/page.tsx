'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { InviteForm } from './InviteForm'

export default function InvitePage() {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <Suspense fallback={<p className="text-center text-gray-500 text-sm">Loading…</p>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  )
}
