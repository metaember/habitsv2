'use client'

import { useState, useEffect } from 'react'
import CalendarHeatmap from '@/components/CalendarHeatmap'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(newMonth)
  }

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="text-lg font-medium min-w-48 text-center">
            {formatMonthYear(currentMonth)}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>
      
      <CalendarHeatmap month={currentMonth} />
    </div>
  )
}