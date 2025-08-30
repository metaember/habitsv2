// Next.js API route for habit events
import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { EventCreateDto } from '@/lib/validation'
import { EventListResponse, EventCreateResponse } from '@/lib/api-schema'
import { requireAuth } from '@/lib/auth-server'
import { z } from 'zod'

// GET /api/habits/:id/events - List events for a habit
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let prisma = null
  try {
    const user = await requireAuth()
    prisma = await getPrismaClient()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    // Validate habit ID
    if (!params.id) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Habit ID is required' } },
        { status: 400 }
      )
    }
    
    // Build date filter
    const dateFilter: any = {}
    if (from) {
      dateFilter.gte = new Date(from)
    }
    if (to) {
      dateFilter.lte = new Date(to)
    }
    
    // Get user's household info
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { householdId: true }
    })

    // Build where condition for habit access
    const habitWhereConditions: any[] = [
      { ownerUserId: user.id }, // User's own habits
    ]
    
    // If user is in a household, also allow access to household habits from same household
    if (currentUser?.householdId) {
      habitWhereConditions.push({
        AND: [
          { visibility: 'household' },
          { owner: { householdId: currentUser.householdId } }
        ]
      })
    }

    // Verify habit is accessible to user
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        OR: habitWhereConditions
      }
    })

    if (!habit) {
      return NextResponse.json(
        { error: { code: 'NotFound', message: 'Habit not found' } },
        { status: 404 }
      )
    }

    // Fetch events from database
    const events = await prisma.event.findMany({
      where: {
        habitId: params.id,
        ...(Object.keys(dateFilter).length > 0 ? { tsClient: dateFilter } : {}),
      },
      orderBy: {
        tsServer: 'desc',
      },
    })
    
    // Validate response
    EventListResponse.parse(events)
    
    return NextResponse.json(events)
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
    
    console.error('Failed to fetch events:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to fetch events' } },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// POST /api/habits/:id/events - Create a new event for a habit
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let prisma = null
  try {
    const user = await requireAuth()
    prisma = await getPrismaClient()
    const body = await request.json()
    
    // Validate habit ID
    if (!params.id) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'Habit ID is required' } },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validatedData = EventCreateDto.parse(body)
    
    // Get user's household info
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { householdId: true }
    })

    // Build where condition for habit access
    const habitWhereConditions: any[] = [
      { ownerUserId: user.id }, // User's own habits
    ]
    
    // If user is in a household, also allow access to household habits from same household
    if (currentUser?.householdId) {
      habitWhereConditions.push({
        AND: [
          { visibility: 'household' },
          { owner: { householdId: currentUser.householdId } }
        ]
      })
    }

    // Check if habit exists and is accessible to user
    const habit = await prisma.habit.findFirst({
      where: { 
        id: params.id,
        OR: habitWhereConditions
      },
    })
    
    if (!habit) {
      return NextResponse.json(
        { error: { code: 'NotFound', message: 'Habit not found' } },
        { status: 404 }
      )
    }
    
    // Set timestamps
    const now = new Date()
    const tsClient = validatedData.tsClient ? new Date(validatedData.tsClient) : now
    
    // Validate tsClient is not in the future (with 5 minute skew)
    if (tsClient > new Date(now.getTime() + 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: { code: 'BadRequest', message: 'tsClient cannot be in the future' } },
        { status: 400 }
      )
    }
    
    // Create event in database
    const event = await prisma.event.create({
      data: {
        habitId: params.id,
        userId: user.id, // Set user for the event
        tsClient,
        value: validatedData.value,
        note: validatedData.note,
        clientId: validatedData.clientId,
        // Set default values for fields not in the DTO
        source: 'ui', // Default source
      },
    })
    
    // Validate response
    const response = { eventId: event.id }
    EventCreateResponse.parse(response)
    
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
    
    console.error('Failed to create event:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to create event' } },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}