'use client'

import { useState, useEffect } from 'react'
import { Habit } from '@prisma/client'
import { toast } from 'react-hot-toast'

interface LogSheetProps {
  habit: Habit
  onClose: () => void
  onLog: () => void
}

export default function LogSheet({ habit, onClose, onLog }: LogSheetProps) {
  const [value, setValue] = useState(1)
  const [note, setNote] = useState('')
  const [logging, setLogging] = useState(false)
  const [recentValues, setRecentValues] = useState<number[]>([])

  // Load recent values for custom units
  useEffect(() => {
    if (habit.unit === 'custom') {
      loadRecentValues()
    }
  }, [habit.id, habit.unit])

  const loadRecentValues = async () => {
    try {
      const res = await fetch(`/api/habits/${habit.id}/events?limit=10`)
      if (res.ok) {
        const events = await res.json()
        // Get unique values from recent events, sorted by frequency
        const values: number[] = events.map((e: any) => e.value)
        const uniqueValues = Array.from(new Set(values))
          .sort((a: number, b: number) => values.lastIndexOf(b) - values.lastIndexOf(a))
          .slice(0, 4)
        setRecentValues(uniqueValues)
      }
    } catch (error) {
      // Silently fail - recent values are optional
    }
  }

  const getUnitDisplay = () => {
    if (habit.unit === 'custom' && habit.unitLabel) {
      return habit.unitLabel
    }
    return habit.unit === 'minutes' ? 'minutes' : 'times'
  }

  const getQuickPresets = () => {
    if (habit.unit === 'count') {
      return [1, 2, 3, 5]
    } else if (habit.unit === 'minutes') {
      return [5, 10, 15, 30]
    } else if (habit.unit === 'custom' && recentValues.length > 0) {
      return recentValues.slice(0, 4)
    } else {
      return [1, 2, 5, 10]
    }
  }

  const handleLog = async () => {
    setLogging(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: habit.type === 'break' ? 1 : value,
          note: note.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onLog()
        onClose()
        
        // Show success message
        toast.success('Event logged successfully!')
      } else {
        toast.error('Failed to log event')
      }
    } catch (error) {
      toast.error('Failed to log event')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{habit.emoji || '⭐'}</div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Log Progress</h3>
              <p className="text-sm text-slate-500">{habit.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Value Input for Build Habits */}
          {habit.type === 'build' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                How much did you complete?
              </label>
              
              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {getQuickPresets().map((quickValue) => (
                  <button
                    key={quickValue}
                    onClick={() => setValue(quickValue)}
                    className={`px-3 py-3 rounded-xl font-medium transition-all text-sm ${
                      value === quickValue
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    +{quickValue}
                  </button>
                ))}
              </div>
              
              {/* Numeric Input with Unit Label */}
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step={habit.unit === 'minutes' ? '5' : '1'}
                  value={value}
                  onChange={(e) => setValue(Math.max(1, Number(e.target.value)))}
                  className="w-full p-4 pr-20 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                  placeholder="Enter amount"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  {getUnitDisplay()}
                </div>
              </div>
              
              {/* Unit hint */}
              <p className="text-xs text-slate-500 mt-2">
                {habit.unit === 'count' && 'Count how many times you completed this habit'}
                {habit.unit === 'minutes' && 'Track time spent in minutes'}
                {habit.unit === 'custom' && habit.unitLabel && `Track progress in ${habit.unitLabel}`}
              </p>
            </div>
          )}
          
          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`How did ${habit.name.toLowerCase()} go today?`}
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={280}
            />
            <p className="text-xs text-slate-400 mt-1">
              {note.length}/280 characters
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleLog}
              disabled={logging}
              className={`flex-1 py-4 px-6 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                habit.type === 'build'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
              }`}
            >
              {logging ? 'Logging...' : habit.type === 'build' ? 'Log Progress' : 'Log Incident'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}