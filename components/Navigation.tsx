'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="border-t border-gray-200 fixed bottom-0 w-full bg-white">
      <div className="flex justify-around items-center h-16">
        <Link href="/today" passHref>
          <Button 
            variant={pathname === '/today' ? 'default' : 'ghost'}
            className="flex flex-col items-center"
          >
            <span>Today</span>
          </Button>
        </Link>
        
        <Link href="/settings" passHref>
          <Button 
            variant={pathname === '/settings' ? 'default' : 'ghost'}
            className="flex flex-col items-center"
          >
            <span>Settings</span>
          </Button>
        </Link>
      </div>
    </nav>
  )
}