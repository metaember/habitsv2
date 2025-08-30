import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/households - Get current user's household
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        household: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      household: user.household
    })

  } catch (error) {
    console.error('Error fetching household:', error)
    return NextResponse.json(
      { error: 'Failed to fetch household' },
      { status: 500 }
    )
  }
}

// POST /api/households - Create a new household
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if user is already in a household
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true }
    })

    if (existingUser?.householdId) {
      return NextResponse.json({ error: 'User already in a household' }, { status: 400 })
    }

    // Create household and add current user
    const household = await prisma.household.create({
      data: {
        name,
        users: {
          connect: { id: session.user.id }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json({ household })

  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { error: 'Failed to create household' },
      { status: 500 }
    )
  }
}