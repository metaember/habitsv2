import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// POST /api/households/members - Add member to household by email
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get current user's household
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true }
    })

    if (!currentUser?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: { id: true, householdId: true, name: true }
    })

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToAdd.householdId) {
      return NextResponse.json({ error: 'User already in a household' }, { status: 400 })
    }

    // Add user to household
    await prisma.user.update({
      where: { id: userToAdd.id },
      data: { householdId: currentUser.householdId }
    })

    // Return updated household
    const household = await prisma.household.findUnique({
      where: { id: currentUser.householdId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            color: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ household })

  } catch (error) {
    console.error('Error adding household member:', error)
    return NextResponse.json(
      { error: 'Failed to add household member' },
      { status: 500 }
    )
  }
}

// DELETE /api/households/members - Remove member from household
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get current user's household
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true }
    })

    if (!currentUser?.householdId) {
      return NextResponse.json({ error: 'User not in a household' }, { status: 400 })
    }

    // Verify the user to remove is in the same household
    const userToRemove = await prisma.user.findUnique({
      where: { id: userIdToRemove },
      select: { householdId: true }
    })

    if (userToRemove?.householdId !== currentUser.householdId) {
      return NextResponse.json({ error: 'User not in same household' }, { status: 400 })
    }

    // Remove user from household
    await prisma.user.update({
      where: { id: userIdToRemove },
      data: { householdId: null }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing household member:', error)
    return NextResponse.json(
      { error: 'Failed to remove household member' },
      { status: 500 }
    )
  }
}