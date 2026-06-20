import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/utils'
import { CheckIcon, VideoIcon, MicIcon, FileTextIcon, ZapIcon } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-600/20 text-violet-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <ZapIcon className="w-3 h-3" />
          Powered by Whisper · Claude · ElevenLabs
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl mb-4 leading-[1.05]">
          Dub English videos into
          <span className="block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            natural spoken Farsi
          </span>
        </h1>

        <p className="font-farsi text-2xl sm:text-3xl text-zinc-400 mb-4 mt-2" dir="rtl">
          دوبله هوشمند — فارسی محاوره‌ای تهرانی
        </p>

        <p className="text-zinc-400 text-lg max-w-xl mb-10">
          Upload any video or paste a YouTube link. Our AI pipeline transcribes, translates into conversational Tehran-style Farsi, synthesizes voice, and delivers a polished dubbed video.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href={user ? '/upload' : '/auth/signup'}>
            <Button size="lg" className="min-w-[180px]">Try it free →</Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="secondary" size="lg">See how it works</Button>
          </Link>
        </div>

        <div className="mt-20 w-full max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 text-left">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
                Original — English
              </p>
              <div className="space-y-3">
                {[
                  { time: '0:00', text: "Welcome back to the channel. Today we're going to explore something fascinating." },
                  { time: '0:06', text: 'Scientists have discovered a new technique that could change everything.' },
                  { time: '0:12', text: "Let's dive right in and see what this is all about." },
                ].map((s) => (
                  <div key={s.time} className="flex gap-3">
                    <span className="text-xs text-zinc-600 tabular-nums pt-0.5 shrink-0">{s.time}</span>
                    <p className="text-sm text-zinc-300">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-violet-600/20 bg-violet-600/5 p-5 text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-end gap-2">
                دوبله شده — فارسی
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              </p>
              <div className="space-y-3 font-farsi">
                {[
                  { time: '۰:۰۰', text: 'خوش برگشتید. امروز می‌خوایم یه چیز جذاب کشف کنیم.' },
                  { time: '۰:۰۶', text: 'دانشمندا یه روش جدید پیدا کردن که می‌تونه همه چیز رو عوض کنه.' },
                  { time: '۰:۱۲', text: 'بریم ببینیم ماجرا از چه قراره.' },
                ].map((s) => (
                  <div key={s.time} className="flex gap-3 flex-row-reverse">
                    <span className="text-xs text-zinc-600 tabular-nums pt-0.5 shrink-0">{s.time}</span>
                    <p className="text-sm text-zinc-300">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-zinc-400 text-center mb-16">Seven steps, fully automated. Done in minutes.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: VideoIcon, step: '01', title: 'Upload or link', desc: 'Drop a video file up to 500MB or paste a YouTube URL.' },
              { icon: MicIcon, step: '02', title: 'Transcribe', desc: 'OpenAI Whisper extracts speech into timestamped segments.' },
              { icon: FileTextIcon, step: '03', title: 'Translate', desc: 'Claude converts segments into natural conversational Farsi — not stiff literal translation.' },
              { icon: ZapIcon, step: '04', title: 'Synthesize & merge', desc: 'ElevenLabs voices each segment, FFmpeg merges dubbed audio back onto the video.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-violet-500 font-mono">{step}</span>
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-zinc-400 text-center mb-16">Start free. Scale as you grow.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
              <div key={key} className={`rounded-xl border p-6 flex flex-col ${
                key === 'creator' ? 'border-violet-600/50 bg-violet-600/5' : 'border-white/5 bg-white/[0.03]'
              }`}>
                {key === 'creator' && (
                  <span className="text-xs text-violet-400 font-medium mb-3 uppercase tracking-wide">Most popular</span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-zinc-500">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {[
                    `${plan.minutesPerMonth} minutes/month`,
                    'Conversational Farsi',
                    'RTL subtitle (.srt) file',
                    'In-browser transcript editor',
                    key !== 'free' ? 'Priority processing' : null,
                    key === 'pro' ? 'API access' : null,
                  ].filter(Boolean).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <CheckIcon className="w-4 h-4 text-violet-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup">
                  <Button variant={key === 'creator' ? 'primary' : 'secondary'} className="w-full">
                    {key === 'free' ? 'Get started free' : `Start ${plan.name}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">DubFarsi</span>
            <span className="font-farsi">· دابفارسی</span>
          </div>
          <p>© {new Date().getFullYear()} DubFarsi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
