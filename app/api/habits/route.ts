// Next.js API route for habits
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { HabitCreateDto, ErrorResponse } from '@/lib/validation'
import { HabitListResponse, HabitCreateResponse } from '@/lib/api-schema'

// GET /api/habits - List all habits
export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        emoji: true,
        type: true,
        target: true,
        period: true,
        active: true,
      },
    })
    
    // Validate response
    HabitListResponse.parse(habits)
    
    return NextResponse.json(habits)
  } catch (error) {
    console.error('Failed to fetch habits:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to fetch habits' } },
      { status: 500 }
    )
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = HabitCreateDto.parse(body)
    
    // Create habit in database
    const habit = await prisma.habit.create({
      data: {
        ...validatedData,
        // Set default values for fields not in the DTO
        unit: validatedData.unit || 'count',
        visibility: 'private', // Default visibility
        active: true, // New habits are active by default
      },
    })
    
    // Validate response
    const response = { id: habit.id }
    HabitCreateResponse.parse(response)
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
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
  }
}