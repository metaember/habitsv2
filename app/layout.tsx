// App Router root layout
import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Navigation from '@/components/Navigation'

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
      <body className="pb-16">
        {children}
        <Navigation />
        <Toaster />
      </body>
    </html>
  )
}