import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { filterEffectiveEvents } from '@/lib/event-utils'
import type { Habit } from '@prisma/client'

/**
 * GET /api/calendar?month=YYYY-MM&habit_id=uuid
 * Returns day cells payload for calendar view
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') // YYYY-MM format
  const habitId = searchParams.get('habit_id')

  if (!month) {
    return NextResponse.json(
      { error: 'month parameter required (YYYY-MM)' },
      { status: 400 }
    )
  }

  // Validate month format
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(month)) {
    return NextResponse.json(
      { error: 'month must be in YYYY-MM format' },
      { status: 400 }
    )
  }

  try {
    // Parse month to get date range
    const [year, monthNum] = month.split('-').map(Number)
    const startOfMonth = new Date(year, monthNum - 1, 1)
    const endOfMonth = new Date(year, monthNum, 0) // Last day of month
    
    // Expand to include full weeks (start on Monday)
    const startDate = new Date(startOfMonth)
    const dayOfWeek = startDate.getDay() // 0 = Sunday
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    const endDate = new Date(endOfMonth)
    const endDayOfWeek = endDate.getDay()
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + daysToAdd)

    // Get habits (filtered by habitId if provided)
    const habits = await prisma.habit.findMany({
      where: {
        active: true,
        ...(habitId ? { id: habitId } : {})
      }
    })

    if (habits.length === 0) {
      return NextResponse.json({ days: [] })
    }

    // Get events for the date range
    const events = await prisma.event.findMany({
      where: {
        habitId: habitId ? habitId : { in: habits.map((h: Habit) => h.id) },
        tsClient: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        habit: true
      }
    })

    // Filter out voided events
    const effectiveEvents = filterEffectiveEvents(events)

    // Group events by habit and calculate day cells
    const dayCells: Array<{
      date: string // YYYY-MM-DD
      habits: Array<{
        habitId: string
        name: string
        emoji: string | null
        type: 'build' | 'break'
        target: number
        unit: string
        progress: number
        isSuccess: boolean
        intensity: number // 0-1 for heat map
        events: Array<{
          id: string
          value: number
          note: string | null
          tsClient: string
        }>
      }>
    }> = []

    // Generate day cells
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] // YYYY-MM-DD
      
      const dayHabits = habits.map((habit: Habit) => {
        // Get events for this day and habit
        const dayStart = new Date(currentDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(currentDate)
        dayEnd.setHours(23, 59, 59, 999)
        
        const habitEvents = effectiveEvents.filter(e => 
          e.habitId === habit.id &&
          new Date(e.tsClient) >= dayStart &&
          new Date(e.tsClient) <= dayEnd
        )

        const progress = habitEvents.reduce((sum, e) => sum + e.value, 0)
        
        let isSuccess = false
        let intensity = 0
        
        if (habit.type === 'build') {
          isSuccess = progress >= habit.target
          intensity = Math.min(1, progress / habit.target)
        } else {
          // Break habit: success = no incidents
          isSuccess = habitEvents.length === 0
          intensity = habitEvents.length > 0 ? 1 : 0 // Binary for break habits
        }

        return {
          habitId: habit.id,
          name: habit.name,
          emoji: habit.emoji,
          type: habit.type,
          target: habit.target,
          unit: habit.unit.toString(),
          progress,
          isSuccess,
          intensity,
          events: habitEvents.map(e => ({
            id: e.id,
            value: e.value,
            note: e.note,
            tsClient: e.tsClient.toISOString()
          }))
        }
      })

      dayCells.push({
        date: dateStr,
        habits: dayHabits
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({ days: dayCells })

  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}