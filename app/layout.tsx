import type { Metadata } from 'next'
import './globals.css'
import './mobile.css'

export const metadata: Metadata = {
  title: 'zeroboard',
  description: 'A powerful, lightweight Kanban board application for personal note-taking and project management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
