import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  let prisma: PrismaClient | null = null
  
  try {
    // Create a fresh client for this request
    prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
    
    // Explicitly connect
    await prisma.$connect()
    
    // Simple test query
    const count = await prisma.habit.count()
    
    return NextResponse.json({ 
      success: true,
      habitCount: count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test2 endpoint error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}