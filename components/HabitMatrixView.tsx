'use client'

import { useState, useEffect } from 'react'
import DayDrawer from './DayDrawer'

interface CalendarDay {
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
    intensity: number
    ownerUserId: string | null
    ownerName: string | null
    ownerColor: string | null
    events: Array<{
      id: string
      value: number
      note: string | null
      tsClient: string
    }>
  }>
}

interface HabitMatrixViewProps {
  month: string // YYYY-MM format
}

export default function HabitMatrixView({ month }: HabitMatrixViewProps) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/calendar?month=${month}`)
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data')
        }
        
        const data = await response.json()
        setCalendarData(data.days || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCalendarData()
  }, [month])

  if (loading) {
    return <div className="text-center py-8">Loading matrix...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>
  }

  // Get all unique habits across all days with owner info
  const allHabits = new Map<string, { 
    name: string
    emoji: string | null
    type: 'build' | 'break'
    ownerUserId: string | null
    ownerName: string | null
    ownerColor: string | null
  }>()
  
  calendarData.forEach(day => {
    day.habits.forEach(habit => {
      if (!allHabits.has(habit.habitId)) {
        allHabits.set(habit.habitId, {
          name: habit.name,
          emoji: habit.emoji,
          type: habit.type,
          ownerUserId: habit.ownerUserId,
          ownerName: habit.ownerName,
          ownerColor: habit.ownerColor
        })
      }
    })
  })

  const habits = Array.from(allHabits.entries())

  // Group habits by name
  const habitGroups = new Map<string, typeof habits>()
  habits.forEach(([habitId, habitInfo]) => {
    const groupName = habitInfo.name
    if (!habitGroups.has(groupName)) {
      habitGroups.set(groupName, [])
    }
    habitGroups.get(groupName)!.push([habitId, habitInfo])
  })

  // Sort groups by name
  const sortedGroups = Array.from(habitGroups.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Filter to only show days from the current month
  const [year, monthNum] = month.split('-').map(Number)
  const monthDays = calendarData.filter(day => {
    const date = new Date(day.date + 'T00:00:00')
    return date.getMonth() === monthNum - 1 && date.getFullYear() === year
  })

  // Sort days by date
  const sortedDays = monthDays.sort((a, b) => a.date.localeCompare(b.date))

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const getDayNumber = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').getDate()
  }

  const getHabitStatusForDay = (habitId: string, day: CalendarDay) => {
    const habit = day.habits.find(h => h.habitId === habitId)
    if (!habit) {
      return { isSuccess: false, progress: 0, hasEvents: false }
    }
    
    return {
      isSuccess: habit.isSuccess,
      progress: habit.progress,
      hasEvents: habit.events.length > 0
    }
  }

  const getCellColor = (habitType: 'build' | 'break', isSuccess: boolean, hasEvents: boolean) => {
    if (habitType === 'build') {
      // Build habits: green if successful, gray if not
      return isSuccess ? 'bg-green-500' : 'bg-gray-200'
    } else {
      // Break habits: red if has events (failure), gray if no events (success)
      return hasEvents ? 'bg-red-500' : 'bg-gray-200'
    }
  }

  const getCellBorderColor = (isToday: boolean) => {
    return isToday ? 'border-blue-500 border-2' : 'border-gray-300 border'
  }

  // Get all unique users
  const uniqueUsers = new Map<string, { name: string; color: string }>()
  habits.forEach(([, habitInfo]) => {
    if (habitInfo.ownerUserId && habitInfo.ownerName) {
      uniqueUsers.set(habitInfo.ownerUserId, {
        name: habitInfo.ownerName,
        color: habitInfo.ownerColor || '#6366f1'
      })
    }
  })

  return (
    <div className="w-full">
      {/* Header with day numbers */}
      <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `200px repeat(${sortedDays.length}, 1fr)` }}>
        <div className="p-2"></div> {/* Empty space for habit names */}
        {sortedDays.map(day => (
          <div 
            key={day.date} 
            className={`text-center text-sm font-medium p-1 ${
              isToday(day.date) ? 'text-blue-600 font-bold' : 'text-gray-700'
            }`}
          >
            {getDayNumber(day.date)}
          </div>
        ))}
      </div>

      {/* Matrix rows - grouped by habit name */}
      <div className="space-y-3">
        {sortedGroups.map(([groupName, groupHabits], groupIndex) => (
          <div key={groupName} className="space-y-1">
            {/* Group header if multiple users have the same habit */}
            {groupHabits.length > 1 && (
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider pl-2 pb-1">
                {groupName}
              </div>
            )}
            
            {groupHabits.map(([habitId, habitInfo]) => (
              <div 
                key={habitId} 
                className="grid gap-1 items-center"
                style={{ gridTemplateColumns: `200px repeat(${sortedDays.length}, 1fr)` }}
              >
                {/* Habit name with user indicator */}
                <div className="flex items-center gap-2 p-2 text-sm">
                  <span className="text-lg">{habitInfo.emoji || '⭐'}</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {/* User color indicator */}
                        {habitInfo.ownerName && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: habitInfo.ownerColor || '#6366f1' }}
                              title={habitInfo.ownerName}
                            />
                            {groupHabits.length === 1 && (
                              <span className="text-xs text-gray-500">
                                {habitInfo.ownerName.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Show habit name only if single habit in group, otherwise show user name */}
                        <span>
                          {groupHabits.length > 1 
                            ? habitInfo.ownerName || habitInfo.name
                            : habitInfo.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{habitInfo.type}</div>
                    </div>
                  </div>
                </div>

                {/* Day cells */}
                {sortedDays.map(day => {
                  const status = getHabitStatusForDay(habitId, day)
                  const cellColor = getCellColor(habitInfo.type, status.isSuccess, status.hasEvents)
                  const borderColor = getCellBorderColor(isToday(day.date))
                  
                  return (
                    <div
                      key={`${habitId}-${day.date}`}
                      className={`
                        aspect-square rounded-sm cursor-pointer transition-all duration-200 hover:scale-110
                        ${cellColor} ${borderColor}
                      `}
                      title={`${habitInfo.name} (${habitInfo.ownerName || 'You'}) on ${day.date}: ${
                        habitInfo.type === 'build' 
                          ? (status.isSuccess ? 'Success' : 'Failed')
                          : (status.hasEvents ? 'Had incidents' : 'Clean day')
                      }`}
                      onClick={() => setSelectedDay(day)}
                    />
                  )
                })}
              </div>
            ))}
            
            {/* Add spacing between groups */}
            {groupIndex < sortedGroups.length - 1 && (
              <div className="h-2" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 space-y-3">
        {/* Color meanings */}
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            <span>Build habit success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
            <span>Break habit failure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-sm"></div>
            <span>No activity / Other</span>
          </div>
        </div>

        {/* User legend if multiple users */}
        {uniqueUsers.size > 0 && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-600 font-medium">Users:</span>
            {Array.from(uniqueUsers.entries()).map(([userId, user]) => (
              <div key={userId} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-gray-700">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Matrix view: Habits grouped by type, days as columns. Household habits show user indicators.
      </div>

      {/* Day Drawer */}
      {selectedDay && (
        <DayDrawer
          date={selectedDay.date}
          habits={selectedDay.habits.map(h => ({
            habitId: h.habitId,
            name: h.name,
            emoji: h.emoji,
            type: h.type,
            target: h.target,
            unit: h.unit,
            progress: h.progress,
            isSuccess: h.isSuccess,
            intensity: h.intensity,
            events: h.events
          }))}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          onRefresh={() => {
            // Re-fetch calendar data when events are logged
            const fetchCalendarData = async () => {
              try {
                const response = await fetch(`/api/calendar?month=${month}`)
                if (response.ok) {
                  const data = await response.json()
                  const newCalendarData = data.days || []
                  setCalendarData(newCalendarData)
                  
                  // Update selectedDay with fresh data if it's still selected
                  if (selectedDay) {
                    const updatedSelectedDay = newCalendarData.find((day: CalendarDay) => day.date === selectedDay.date)
                    if (updatedSelectedDay) {
                      setSelectedDay(updatedSelectedDay)
                    }
                  }
                }
              } catch (err) {
                // Silently fail refresh
              }
            }
            fetchCalendarData()
          }}
        />
      )}
    </div>
  )
}