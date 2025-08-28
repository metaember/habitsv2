'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface DayHabit {
  habitId: string
  name: string
  emoji: string | null
  type: 'build' | 'break'
  target: number
  unit: string
  progress: number
  isSuccess: boolean
  intensity: number
  events: Array<{
    id: string
    value: number
    note: string | null
    tsClient: string
  }>
}

interface DayDrawerProps {
  date: string // YYYY-MM-DD
  habits: DayHabit[]
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void // Callback to refresh data after logging
}

export default function DayDrawer({ date, habits, isOpen, onClose, onRefresh }: DayDrawerProps) {
  const [loggingHabits, setLoggingHabits] = useState<Set<string>>(new Set())
  
  if (!isOpen) return null
  
  const isToday = date === new Date().toISOString().split('T')[0]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })
  }

  const getProgressText = (habit: DayHabit) => {
    if (habit.type === 'build') {
      return `${habit.progress}/${habit.target} ${habit.unit}`
    } else {
      return habit.events.length === 0 ? 'No incidents' : `${habit.events.length} incident${habit.events.length > 1 ? 's' : ''}`
    }
  }

  const getStatusColor = (habit: DayHabit) => {
    return habit.isSuccess ? 'text-green-600' : 'text-red-600'
  }

  const getStatusText = (habit: DayHabit) => {
    if (habit.type === 'build') {
      return habit.isSuccess ? 'Target met' : 'Target not met'
    } else {
      return habit.isSuccess ? 'Clean day' : 'Had incidents'
    }
  }
  
  const handleQuickLog = async (habitId: string, habitType: 'build' | 'break') => {
    if (loggingHabits.has(habitId)) return // Prevent double clicks
    
    setLoggingHabits(prev => new Set(Array.from(prev).concat(habitId)))
    
    try {
      const value = habitType === 'break' ? 1 : 1 // Always 1 for quick log
      const res = await fetch(`/api/habits/${habitId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      })
      
      if (res.ok) {
        toast.success(`${habitType === 'break' ? 'Incident' : '+1'} logged successfully!`)
        onRefresh?.() // Refresh the calendar data
      } else {
        toast.error('Failed to log event')
      }
    } catch (error) {
      toast.error('Failed to log event')
    } finally {
      setLoggingHabits(prev => {
        const newSet = new Set(prev)
        newSet.delete(habitId)
        return newSet
      })
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{formatDate(date)}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {habits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No habits tracked</div>
              <div className="text-sm">No habits were active on this day.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <div key={habit.habitId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Link 
                      href={`/habit/${habit.habitId}`}
                      className="flex items-center gap-2 flex-grow hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
                    >
                      {habit.emoji && (
                        <span className="text-lg">{habit.emoji}</span>
                      )}
                      <div>
                        <h3 className="font-medium">{habit.name}</h3>
                        <div className="text-sm text-gray-500 capitalize">
                          {habit.type} habit
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(habit)}`}>
                          {getStatusText(habit)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {getProgressText(habit)}
                        </div>
                      </div>
                      {/* Quick +1 button for today */}
                      {isToday && (
                        <button
                          onClick={() => handleQuickLog(habit.habitId, habit.type)}
                          disabled={loggingHabits.has(habit.habitId)}
                          className={`ml-2 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            habit.type === 'build'
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title={habit.type === 'build' ? 'Quick +1' : 'Log incident'}
                        >
                          {loggingHabits.has(habit.habitId) ? '...' : 
                           habit.type === 'build' ? '+1' : '⚠️'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Events list */}
                  {habit.events.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Events ({habit.events.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {habit.events.map((event) => (
                          <div key={event.id} className="bg-gray-50 rounded p-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {habit.type === 'build' ? `+${event.value}` : 'Incident'}
                              </span>
                              <span className="text-gray-500">
                                {formatTime(event.tsClient)}
                              </span>
                            </div>
                            {event.note && (
                              <div className="text-gray-600 mt-1 italic">
                                "{event.note}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No events logged
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - only show for today */}
        {isToday && (
          <div className="border-t border-gray-200 p-4 sticky bottom-0 bg-white">
            <Link
              href="/today"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Go to Today Page
            </Link>
          </div>
        )}
      </div>
    </>
  )
}