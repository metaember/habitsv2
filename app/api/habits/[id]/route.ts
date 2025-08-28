import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for updating a habit
const HabitUpdateDto = z.object({
  name: z.string().min(1).max(60).optional(),
  emoji: z.string().optional(),
  type: z.enum(['build', 'break']).optional(),
  target: z.number().positive().optional(),
  period: z.enum(['day', 'week', 'month', 'custom']).optional(),
  active: z.boolean().optional(),
})

// PATCH /api/habits/[id] - Update a habit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = HabitUpdateDto.parse(body)
    
    const habit = await prisma.habit.update({
      where: { id: params.id },
      data: validated,
    })
    
    return NextResponse.json(habit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Failed to update habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}