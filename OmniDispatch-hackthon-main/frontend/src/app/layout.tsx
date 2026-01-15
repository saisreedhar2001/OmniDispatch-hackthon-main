import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'OmniDispatch | Wafer-Scale Emergency Intelligence',
  description: 'AI-powered emergency dispatch system with sub-200ms response time. Predictive crisis management at the speed of light.',
  keywords: ['emergency', 'dispatch', 'AI', 'Cerebras', 'ElevenLabs', 'crisis management'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background grid-bg">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}
