'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserContext, UserContextType, useSession } from '@/lib/auth-client'

interface UserProviderProps {
  children: ReactNode
}

export default function UserProvider({ children }: UserProviderProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string
    name: string
    color?: string
  }>>([])

  // Handle authentication redirects
  useEffect(() => {
    if (!isPending && !session && pathname !== '/auth') {
      router.push('/auth')
    }
  }, [isPending, session, pathname, router])

  // Set active user to current session user by default
  useEffect(() => {
    if (session?.user && !activeUserId) {
      setActiveUserId(session.user.id)
      setAvailableUsers([{
        id: session.user.id,
        name: session.user.name,
        color: (session.user as any).color
      }])
    }
  }, [session, activeUserId])

  // Fetch household users
  useEffect(() => {
    if (session?.user) {
      fetch('/api/households')
        .then(res => res.json())
        .then(data => {
          if (data.household?.users) {
            setAvailableUsers(data.household.users)
          } else {
            // User not in household, just show current user
            setAvailableUsers([{
              id: session.user.id,
              name: session.user.name,
              color: (session.user as any).color
            }])
          }
        })
        .catch(error => {
          console.error('Error fetching household:', error)
          // Fallback to just current user
          setAvailableUsers([{
            id: session.user.id,
            name: session.user.name,
            color: (session.user as any).color
          }])
        })
    }
  }, [session])

  const switchUser = (userId: string) => {
    setActiveUserId(userId)
    // Store in localStorage for persistence
    localStorage.setItem('activeUserId', userId)
  }

  // Restore active user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeUserId')
    if (stored && availableUsers.some(u => u.id === stored)) {
      setActiveUserId(stored)
    }
  }, [availableUsers])

  const contextValue: UserContextType = {
    activeUserId,
    switchUser,
    availableUsers
  }

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!session && pathname !== '/auth') {
    return null
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}