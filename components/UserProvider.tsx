'use client'

import { useState, useEffect, ReactNode } from 'react'
import { UserContext, UserContextType, useSession } from '@/lib/auth-client'

interface UserProviderProps {
  children: ReactNode
}

export default function UserProvider({ children }: UserProviderProps) {
  const { data: session } = useSession()
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string
    name: string
    color?: string
  }>>([])

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

  // Fetch household users (for v2, we'll start simple with just the current user)
  useEffect(() => {
    if (session?.user) {
      // TODO: In full v2, fetch household members here
      // For now, just show current user
      setAvailableUsers([{
        id: session.user.id,
        name: session.user.name,
        color: (session.user as any).color
      }])
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

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}