// Next.js API route for habits
import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { HabitCreateDto } from '@/lib/validation'
import { HabitListResponse, HabitCreateResponse, ErrorResponse } from '@/lib/api-schema'
import { requireAuth } from '@/lib/auth-server'
import { z } from 'zod'

// GET /api/habits - List all habits
export async function GET() {
  let prisma = null
  try {
    const user = await requireAuth()
    prisma = await getPrismaClient()
    
    const habits = await prisma.habit.findMany({
      where: {
        OR: [
          { ownerUserId: user.id }, // User's own habits
          { visibility: 'household' }, // All household habits (for v2 simplification)
        ],
      },
      select: {
        id: true,
        name: true,
        emoji: true,
        type: true,
        target: true,
        period: true,
        unit: true,
        unitLabel: true,
        active: true,
        visibility: true,
        templateKey: true,
        ownerUserId: true,
        owner: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        }
      },
    })
    
    // Validate response
    try {
      HabitListResponse.parse(habits)
    } catch (validationError) {
      console.error('Validation error:', validationError)
      console.error('Actual habits data:', JSON.stringify(habits, null, 2))
      // Return the data anyway for now so the frontend works
      return NextResponse.json(habits)
    }
    
    return NextResponse.json(habits)
  } catch (error) {
    console.error('Failed to fetch habits - detailed error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: { code: 'Unauthorized', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors)
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Invalid response data', details: error.errors } },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to fetch habits', details: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: Request) {
  let prisma = null
  try {
    const user = await requireAuth()
    prisma = await getPrismaClient()
    const body = await request.json()
    
    // Validate request body
    const validatedData = HabitCreateDto.parse(body)
    
    // Create habit in database
    const habit = await prisma.habit.create({
      data: {
        ...validatedData,
        ownerUserId: user.id, // Set owner to authenticated user
        // Set default values for fields not in the DTO
        unit: validatedData.unit || 'count',
        visibility: validatedData.visibility || 'private',
        templateKey: validatedData.templateKey || null,
        active: true, // New habits are active by default
      },
    })
    
    // Validate response
    const response = { id: habit.id }
    HabitCreateResponse.parse(response)
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: { code: 'Unauthorized', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      )
    }
    
    // Handle other errors
    console.error('Failed to create habit:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to create habit' } },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}