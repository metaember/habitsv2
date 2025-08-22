'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
      <div className="flex justify-around items-center px-6 py-2 max-w-md mx-auto">
        <Link 
          href="/today" 
          className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${
            pathname === '/today' 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
              : 'text-slate-600 hover:text-blue-500 hover:bg-blue-50'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15v-2a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span className="text-xs font-medium">Today</span>
        </Link>
        
        <Link 
          href="/settings" 
          className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${
            pathname === '/settings' 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
              : 'text-slate-600 hover:text-blue-500 hover:bg-blue-50'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  )
}