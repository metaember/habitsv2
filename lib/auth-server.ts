import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  return session.user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  return user
}