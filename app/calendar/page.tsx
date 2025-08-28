'use client'

import { useState, useEffect } from 'react'
import CalendarHeatmap from '@/components/CalendarHeatmap'
import HabitMatrixView from '@/components/HabitMatrixView'
import AuthGuard from '@/components/AuthGuard'

type ViewMode = 'heatmap' | 'matrix'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')

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
    <AuthGuard>
      <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        
        {/* View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Matrix
            </button>
          </div>
          
          {/* Month Navigation */}
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
      </div>
      
      {/* Render the selected view */}
      {viewMode === 'heatmap' ? (
        <CalendarHeatmap month={currentMonth} />
      ) : (
        <HabitMatrixView month={currentMonth} />
      )}
    </div>
    </AuthGuard>
  )
}