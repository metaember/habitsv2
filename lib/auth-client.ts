'use client'

import { createAuthClient } from "better-auth/react"
import { useContext, createContext } from "react"

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : process.env.BETTER_AUTH_URL!
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient

// User context for active user switching
export interface UserContextType {
  activeUserId: string | null
  switchUser: (userId: string) => void
  availableUsers: Array<{
    id: string
    name: string
    color?: string
  }>
}

export const UserContext = createContext<UserContextType | null>(null)

export const useActiveUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useActiveUser must be used within UserProvider')
  }
  return context
}