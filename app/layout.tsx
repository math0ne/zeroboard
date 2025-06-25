import type { Metadata, Viewport } from 'next'
import './globals.css'
import './mobile.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'zeroboard',
  description: 'A powerful, lightweight Kanban board application for personal note-taking and project management',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
