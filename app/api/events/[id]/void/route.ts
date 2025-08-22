// Next.js API route to void an event
import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { VoidEventDto } from '@/lib/validation'
import { VoidEventResponse } from '@/lib/api-schema'
import { z } from 'zod'

// POST /api/events/:id/void - Void an event
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let prisma = null
  try {
    prisma = await getPrismaClient()
    const body = await request.json()
    
    // Validate event ID
    if (!params.id) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Event ID is required' } },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validatedData = VoidEventDto.parse(body)
    
    // Check if the target event exists
    const targetEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })
    
    if (!targetEvent) {
      return NextResponse.json(
        { error: { code: 'NotFound', message: 'Event not found' } },
        { status: 404 }
      )
    }
    
    // Check if the event is already voided
    const existingVoidEvent = await prisma.event.findFirst({
      where: {
        meta: {
          path: ['void_of'],
          equals: params.id,
        },
      },
    })
    
    if (existingVoidEvent) {
      // Return the existing void event ID
      const response = { voidEventId: existingVoidEvent.id }
      VoidEventResponse.parse(response)
      return NextResponse.json(response, { status: 409 }) // 409 Conflict
    }
    
    // Create a void control event
    const voidEvent = await prisma.event.create({
      data: {
        habitId: targetEvent.habitId,
        userId: targetEvent.userId,
        tsClient: targetEvent.tsClient, // Use the same client timestamp
        value: 0, // Void events have a value of 0
        note: 'Voided event',
        source: 'ui',
        clientId: `void_${params.id}`, // Generate a unique client ID for the void event
        meta: {
          kind: 'void',
          void_of: params.id,
          reason: validatedData.reason || 'other',
        },
      },
    })
    
    // Validate response
    const response = { voidEventId: voidEvent.id }
    VoidEventResponse.parse(response)
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      )
    }
    
    console.error('Failed to void event:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to void event' } },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}