'use client'

import React, { useState, useEffect } from 'react'
import { Habit, Event } from '@prisma/client'
import { getHabitStats } from '@/lib/stats'

interface MonthCalendarProps {
  habit: Habit
  events: Event[]
  month?: string // YYYY-MM format
}

export default function MonthCalendar({ habit, events, month }: MonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    if (month) return month
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [calendarDays, setCalendarDays] = useState<Array<{
    date: string
    day: number
    isCurrentMonth: boolean
    hasEvent: boolean
    isComplete: boolean
    eventCount: number
    totalValue: number
  }>>([])

  useEffect(() => {
    generateCalendarDays()
  }, [currentMonth, events])

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
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.tsClient).toISOString().split('T')[0]
        return eventDate === dateString && 
          !(e.meta && typeof e.meta === 'object' && 'kind' in e.meta && e.meta.kind === 'void')
      })
      
      const totalValue = dayEvents.reduce((sum, e) => sum + e.value, 0)
      const isComplete = habit.type === 'build' 
        ? totalValue >= habit.target 
        : dayEvents.length === 0
      
      days.push({
        date: dateString,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month - 1,
        hasEvent: dayEvents.length > 0,
        isComplete,
        eventCount: dayEvents.length,
        totalValue
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
    
    if (habit.type === 'build') {
      if (!day.hasEvent) return 'bg-white hover:bg-gray-50'
      if (day.isComplete) return 'bg-green-500 text-white'
      const progress = (day.totalValue / habit.target) * 100
      if (progress >= 75) return 'bg-green-400 text-white'
      if (progress >= 50) return 'bg-green-300 text-gray-800'
      if (progress >= 25) return 'bg-green-200 text-gray-800'
      return 'bg-green-100 text-gray-800'
    } else {
      // Break habits
      if (day.hasEvent) return 'bg-red-500 text-white'
      return 'bg-green-500 text-white'
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Calendar</h3>
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
              aspect-square flex flex-col items-center justify-center rounded-md transition-colors
              ${getDayColor(day)}
              ${isToday(day.date) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              ${day.isCurrentMonth ? 'cursor-pointer' : ''}
            `}
            title={day.isCurrentMonth ? `${day.date}: ${day.totalValue} ${habit.unitLabel || habit.unit || ''}` : ''}
          >
            <span className="text-sm font-medium">{day.day}</span>
            {day.isCurrentMonth && day.hasEvent && habit.type === 'build' && (
              <span className="text-xs mt-0.5">
                {day.totalValue}/{habit.target}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>{habit.type === 'build' ? 'Complete' : 'Clean'}</span>
        </div>
        {habit.type === 'build' && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>No activity</span>
            </div>
          </>
        )}
        {habit.type === 'break' && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Incident</span>
          </div>
        )}
      </div>
    </div>
  )
}