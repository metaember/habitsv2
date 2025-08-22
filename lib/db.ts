import { PrismaClient } from '@prisma/client'

// Create a function that returns a connected Prisma client
export async function getPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  
  // Ensure connection
  await client.$connect()
  return client
}

// For compatibility, also export a singleton for non-critical usage
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}