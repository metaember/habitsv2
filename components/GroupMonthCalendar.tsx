'use client'

import React, { useState, useEffect } from 'react'
import { Habit, Event } from '@prisma/client'
import { getHabitStats } from '@/lib/stats'

interface HabitWithOwner extends Habit {
  owner?: {
    id: string
    name: string
    color?: string
  }
}

interface GroupMonthCalendarProps {
  habits: HabitWithOwner[]
  eventsMap: { [habitId: string]: Event[] }
  currentUserId?: string
  month?: string // YYYY-MM format
}

export default function GroupMonthCalendar({ 
  habits, 
  eventsMap, 
  currentUserId,
  month 
}: GroupMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    if (month) return month
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [calendarDays, setCalendarDays] = useState<Array<{
    date: string
    day: number
    isCurrentMonth: boolean
    completions: Array<{
      userId: string
      userName: string
      userColor: string
      value: number
      isComplete: boolean
    }>
    totalCompletions: number
    currentUserCompleted: boolean
  }>>([])

  const primaryHabit = habits[0]
  if (!primaryHabit) return null

  useEffect(() => {
    generateCalendarDays()
  }, [currentMonth, eventsMap])

  const generateCalendarDays = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    // Get the first Monday before or on the first day of the month
    const startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday)
    
    const days: typeof calendarDays = []
    const currentDate = new Date(startDate)
    
    // Generate 6 weeks of days (42 days total)
    for (let i = 0; i < 42; i++) {
      const dateString = currentDate.toISOString().split('T')[0]
      const dayCompletions: typeof calendarDays[0]['completions'] = []
      
      habits.forEach(habit => {
        const events = eventsMap[habit.id] || []
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.tsClient).toISOString().split('T')[0]
          return eventDate === dateString && 
            !(e.meta && typeof e.meta === 'object' && 'kind' in e.meta && e.meta.kind === 'void')
        })
        
        const totalValue = dayEvents.reduce((sum, e) => sum + e.value, 0)
        const isComplete = primaryHabit.type === 'build' 
          ? totalValue >= habit.target 
          : dayEvents.length === 0
        
        if (dayEvents.length > 0 || (primaryHabit.type === 'break' && currentDate <= new Date())) {
          dayCompletions.push({
            userId: habit.owner?.id || '',
            userName: habit.owner?.name || 'Unknown',
            userColor: habit.owner?.color || '#64748b',
            value: totalValue,
            isComplete
          })
        }
      })
      
      const totalCompletions = dayCompletions.filter(c => c.isComplete).length
      const currentUserCompleted = dayCompletions.some(c => c.userId === currentUserId && c.isComplete)
      
      days.push({
        date: dateString,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month - 1,
        completions: dayCompletions,
        totalCompletions,
        currentUserCompleted
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    setCalendarDays(days)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number)
    const newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1)
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`)
  }

  const getMonthYearDisplay = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  const getDayColor = (day: typeof calendarDays[0]) => {
    if (!day.isCurrentMonth) return 'bg-gray-50 text-gray-400'
    
    const maxCompletions = habits.length
    const completionRatio = day.totalCompletions / maxCompletions
    
    if (day.totalCompletions === 0) return 'bg-white hover:bg-gray-50'
    
    // Color intensity based on number of completions
    if (completionRatio === 1) return 'bg-green-600 text-white'
    if (completionRatio >= 0.75) return 'bg-green-500 text-white'
    if (completionRatio >= 0.5) return 'bg-green-400 text-white'
    if (completionRatio >= 0.25) return 'bg-green-300 text-gray-800'
    return 'bg-green-200 text-gray-800'
  }

  const getDayBorder = (day: typeof calendarDays[0]) => {
    if (!day.isCurrentMonth) return ''
    if (day.currentUserCompleted) return 'ring-2 ring-blue-500 ring-inset'
    return ''
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Group Activity Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {getMonthYearDisplay()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* User legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-gray-700">Members:</span>
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: habit.owner?.color || '#64748b' }}
              />
              <span className="text-gray-600">{habit.owner?.name || 'Unknown'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square flex flex-col items-center justify-center rounded-md transition-all relative
              ${getDayColor(day)}
              ${getDayBorder(day)}
              ${isToday(day.date) ? 'ring-2 ring-offset-2 ring-black' : ''}
              ${day.isCurrentMonth ? 'cursor-pointer' : ''}
            `}
            title={day.isCurrentMonth ? `${day.date}: ${day.totalCompletions}/${habits.length} completed` : ''}
          >
            <span className="text-sm font-medium">{day.day}</span>
            
            {/* Completion indicator */}
            {day.isCurrentMonth && day.totalCompletions > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {day.completions.map((completion, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: completion.isComplete ? completion.userColor : 'transparent',
                      border: completion.isComplete ? 'none' : `1px solid ${completion.userColor}`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Current user indicator */}
            {day.isCurrentMonth && day.currentUserCompleted && (
              <div className="absolute top-1 right-1">
                <svg className="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>All completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>None</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span>You completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-2 border-black rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}