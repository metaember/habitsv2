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
    <html lang="en" className="h-full">
      <body className="h-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 antialiased pb-20">
        <main className="min-h-full">
          {children}
        </main>
        <Navigation />
        <Toaster 
          position="bottom-center"
          toastOptions={{
            className: 'bg-white shadow-lg border border-slate-200 text-slate-900 rounded-xl',
            duration: 3000,
          }}
        />
      </body>
    </html>
  )
}