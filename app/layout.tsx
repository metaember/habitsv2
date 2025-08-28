// App Router root layout
import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Navigation from '@/components/Navigation'
import TopNavigation from '@/components/TopNavigation'
import UserProvider from '@/components/UserProvider'

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
        <UserProvider>
          <TopNavigation />
          <main className="min-h-full pt-4">
            {children}
          </main>
          <Navigation />
        </UserProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'bg-white shadow-lg border border-slate-200 text-slate-900 rounded-xl',
            duration: 3000,
            style: {
              marginTop: '1rem',
            },
          }}
        />
      </body>
    </html>
  )
}