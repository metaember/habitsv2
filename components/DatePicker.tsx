'use client'

import { useState, useEffect } from 'react'
import { Event } from '@prisma/client'
import {
  formatDateDisplay,
  getCalendarDays,
  isSameDay,
  isToday,
  isFutureDate,
  getDateKey,
  parseISOToDate
} from '@/lib/date-utils'

interface DatePickerProps {
  habitId?: string
  value: Date
  onChange: (date: Date) => void
  events?: Event[]
  onClose?: () => void
}

export default function DatePicker({ habitId, value, onChange, events = [], onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(value)
  const [eventsByDate, setEventsByDate] = useState<Map<string, Event[]>>(new Map())

  useEffect(() => {
    // Group events by date for easy lookup
    const grouped = new Map<string, Event[]>()
    events.forEach(event => {
      const date = parseISOToDate(event.tsClient.toString())
      const key = getDateKey(date)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(event)
    })
    setEventsByDate(grouped)
  }, [events])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const handleDateSelect = (date: Date) => {
    if (!isFutureDate(date)) {
      onChange(date)
      onClose?.()
    }
  }

  const getCompletionStatus = (date: Date | null) => {
    if (!date) return null
    const key = getDateKey(date)
    const dayEvents = eventsByDate.get(key) || []
    if (dayEvents.length === 0) return null
    
    // Calculate total value for the day
    const totalValue = dayEvents.reduce((sum, event) => sum + event.value, 0)
    
    // Return completion level (you can adjust thresholds based on habit target)
    if (totalValue > 0) {
      return {
        count: dayEvents.length,
        value: totalValue,
        hasCompletion: true
      }
    }
    return null
  }

  const calendarDays = getCalendarDays(currentMonth)
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-sm font-semibold text-slate-900">{monthYear}</h3>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Next month"
          disabled={isToday(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0))}
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleDateSelect(new Date())}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            handleDateSelect(yesterday)
          }}
          className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          Yesterday
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const isSelected = isSameDay(date, value)
          const isTodayDate = isToday(date)
          const isFuture = isFutureDate(date)
          const completion = getCompletionStatus(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateSelect(date)}
              disabled={isFuture}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium
                relative transition-all duration-200 hover:scale-110
                ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : ''}
                ${isTodayDate && !isSelected ? 'bg-blue-100 text-blue-700' : ''}
                ${!isSelected && !isTodayDate && !isFuture ? 'hover:bg-slate-100' : ''}
                ${isFuture ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700'}
              `}
            >
              <span>{date.getDate()}</span>
              
              {/* Completion indicator */}
              {completion && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  <div 
                    className={`
                      w-1.5 h-1.5 rounded-full
                      ${completion.value >= 1 ? 'bg-green-500' : 'bg-yellow-500'}
                      ${isSelected ? 'ring-2 ring-white' : ''}
                    `}
                    title={`${completion.count} log${completion.count > 1 ? 's' : ''}, total: ${completion.value}`}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-slate-600">Partial</span>
        </div>
      </div>
    </div>
  )
}