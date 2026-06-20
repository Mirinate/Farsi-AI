'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

export function Navbar({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">DubFarsi</span>
          <span className="font-farsi text-sm text-zinc-500">دابفارسی</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <Link href="/upload"><Button variant="primary" size="sm">New Dub</Button></Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/signup"><Button variant="primary" size="sm">Get started free</Button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
