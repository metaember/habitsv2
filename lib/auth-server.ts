import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function getAuthenticatedUser() {
  const requestHeaders = await headers()
  console.log('Auth headers:', Object.fromEntries(requestHeaders.entries()))
  
  const session = await auth.api.getSession({
    headers: requestHeaders
  })
  
  console.log('Session result:', session)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  return session.user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  return user
}