// App Router root layout
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Track your habits and build better routines',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}