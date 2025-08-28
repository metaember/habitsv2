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
    intensity: number // 0-1 for heat map
    events: Array<{
      id: string
      value: number
      note: string | null
      tsClient: string
    }>
  }>
}

interface CalendarHeatmapProps {
  month: string // YYYY-MM format
}

export default function CalendarHeatmap({ month }: CalendarHeatmapProps) {
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
    return <div className="text-center py-8">Loading calendar...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>
  }

  const getDayIntensity = (day: CalendarDay) => {
    if (day.habits.length === 0) return 0
    
    // Calculate average intensity across all habits
    const totalIntensity = day.habits.reduce((sum, habit) => sum + habit.intensity, 0)
    return totalIntensity / day.habits.length
  }

  const getSuccessCount = (day: CalendarDay) => {
    return day.habits.filter(h => h.isSuccess).length
  }

  const getTotalHabits = (day: CalendarDay) => {
    return day.habits.length
  }

  const isCurrentMonth = (dateStr: string) => {
    const [year, monthNum] = month.split('-').map(Number)
    const date = new Date(dateStr + 'T00:00:00')
    return date.getMonth() === monthNum - 1 && date.getFullYear() === year
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.25) return 'bg-green-100'
    if (intensity < 0.5) return 'bg-green-200'
    if (intensity < 0.75) return 'bg-green-300'
    if (intensity < 1) return 'bg-green-400'
    return 'bg-green-500'
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Group days into weeks
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7))
  }

  return (
    <div className="w-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const intensity = getDayIntensity(day)
              const successCount = getSuccessCount(day)
              const totalHabits = getTotalHabits(day)
              const dayNumber = new Date(day.date + 'T00:00:00').getDate()
              const currentMonth = isCurrentMonth(day.date)
              const today = isToday(day.date)

              return (
                <div
                  key={day.date}
                  className={`
                    relative aspect-square border border-gray-200 rounded-lg p-1 text-xs
                    ${getIntensityColor(intensity)}
                    ${!currentMonth ? 'opacity-40' : ''}
                    ${today ? 'ring-2 ring-blue-500' : ''}
                    hover:ring-2 hover:ring-gray-300 cursor-pointer
                    transition-all duration-200
                  `}
                  title={`${day.date}: ${successCount}/${totalHabits} habits successful`}
                  onClick={() => setSelectedDay(day)}
                >
                  {/* Day number */}
                  <div className={`text-xs font-medium ${today ? 'text-blue-700' : 'text-gray-700'}`}>
                    {dayNumber}
                  </div>
                  
                  {/* Success indicator */}
                  {totalHabits > 0 && (
                    <div className="absolute bottom-1 right-1">
                      <div className={`
                        w-2 h-2 rounded-full text-xs flex items-center justify-center
                        ${successCount === totalHabits ? 'bg-green-600' : 
                          successCount > 0 ? 'bg-yellow-500' : 'bg-red-400'}
                      `}>
                      </div>
                    </div>
                  )}

                  {/* Habit count for days with habits */}
                  {totalHabits > 0 && (
                    <div className="absolute top-1 right-1 text-xs text-gray-600">
                      {successCount}/{totalHabits}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
      
      {/* Legend explanation */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Color intensity shows average habit completion. Numbers show successful/total habits per day.
      </div>

      {/* Day Drawer */}
      {selectedDay && (
        <DayDrawer
          date={selectedDay.date}
          habits={selectedDay.habits}
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