import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DubFarsi — AI-Powered English to Farsi Video Dubbing',
  description: 'Dub your English videos into natural, conversational Farsi using AI. Powered by Whisper, Claude, and ElevenLabs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#ededed]">
        {children}
      </body>
    </html>
  )
}
