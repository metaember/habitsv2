'use client'

import React, { useEffect, useState } from 'react'
import { Habit, Event } from '@prisma/client'
import { toast } from 'react-hot-toast'
import { getHabitStats } from '@/lib/stats'
import { getCurrentPeriod } from '@/lib/period'
import { useSession } from '@/lib/auth-client'
import LogSheet from './LogSheet'

interface HabitWithOwner extends Habit {
  events?: Event[]
  owner?: {
    id: string
    name: string
    color?: string
  }
}

interface MergedHabitCardProps {
  templateKey: string
  habits: HabitWithOwner[]
  emoji?: string
  name: string
}

export default function MergedHabitCard({ 
  templateKey, 
  habits, 
  emoji = '🎯',
  name 
}: MergedHabitCardProps) {
  const [habitEvents, setHabitEvents] = useState<{ [habitId: string]: Event[] }>({})
  const [loading, setLoading] = useState(true)
  const [showLogSheet, setShowLogSheet] = useState(false)
  const { data: session } = useSession()
  
  // Find the current user's habit in the group
  const currentUserHabit = habits.find(h => h.owner?.id === session?.user?.id)

  useEffect(() => {
    fetchAllEvents()
  }, [habits])

  const fetchAllEvents = async () => {
    try {
      const eventPromises = habits.map(async (habit) => {
        const res = await fetch(`/api/habits/${habit.id}/events`)
        const events = await res.json()
        return { habitId: habit.id, events }
      })
      
      const results = await Promise.all(eventPromises)
      const eventsMap: { [habitId: string]: Event[] } = {}
      
      results.forEach(({ habitId, events }) => {
        eventsMap[habitId] = events
      })
      
      setHabitEvents(eventsMap)
    } catch (error) {
      console.error('Failed to fetch events for merged habits:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use the first habit's configuration for display
  const primaryHabit = habits[0]
  if (!primaryHabit) return null

  const periodLabel = {
    day: 'today',
    week: 'this week',
    month: 'this month',
    custom: 'this period'
  }[primaryHabit.period] || 'this period'

  const unitDisplay = primaryHabit.unit === 'custom' && primaryHabit.unitLabel 
    ? primaryHabit.unitLabel 
    : primaryHabit.unit === 'minutes' 
      ? 'min' 
      : ''

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>{primaryHabit.type === 'build' ? '📈' : '🚫'}</span>
              <span>{primaryHabit.target}{unitDisplay ? ` ${unitDisplay}` : ''} · {periodLabel}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Household
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-user progress bars */}
      {loading ? (
        <div className="space-y-3 mb-4">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {habits.map((habit) => {
            const events = habitEvents[habit.id] || []
            const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
            const progressPercentage = habit.type === 'build' 
              ? Math.min(100, (stats.currentPeriodProgress / habit.target) * 100)
              : 0

            const userColor = habit.owner?.color || '#64748b'
            const userName = habit.owner?.name || 'Unknown User'
            const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()
            const isCurrentUser = habit.owner?.id === session?.user?.id
          
          return (
            <div key={habit.id} className={`flex items-center space-x-3 ${isCurrentUser ? 'bg-blue-50 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
              {/* User avatar */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {userInitials}
              </div>

              {/* Progress bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isCurrentUser ? 'text-blue-700' : 'text-slate-700'}`}>
                    {isCurrentUser ? `${userName} (You)` : userName}
                  </span>
                  <span className="text-sm text-slate-500">
                    {stats.currentPeriodProgress}
                    {primaryHabit.type === 'build' && `/${habit.target}`}
                    {unitDisplay && ` ${unitDisplay}`}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, progressPercentage)}%`,
                      backgroundColor: progressPercentage >= 100 ? '#10b981' : userColor 
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Action buttons for current user */}
      {currentUserHabit && (
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={async () => {
              try {
                const quickValue = currentUserHabit.unit === 'minutes' ? 5 : 1
                const response = await fetch(`/api/habits/${currentUserHabit.id}/events`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    value: quickValue,
                  }),
                })

                if (response.ok) {
                  toast.success('Logged successfully!')
                  fetchAllEvents()
                } else {
                  toast.error('Failed to log event')
                }
              } catch (error) {
                toast.error('Failed to log event')
              }
            }}
            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            {currentUserHabit.type === 'build' 
              ? (currentUserHabit.unit === 'minutes' ? '+5min' : '+1')
              : 'Log Incident'
            }
          </button>
          
          <button
            onClick={() => setShowLogSheet(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Summary stats */}
      <div className="mt-4 text-center text-sm text-slate-500">
        {habits.length} member{habits.length !== 1 ? 's' : ''} • 
        {loading ? ' ...' : ` ${habits.reduce((total, habit) => {
          const events = habitEvents[habit.id] || []
          const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
          return total + stats.currentPeriodProgress
        }, 0)} total ${unitDisplay}`}
      </div>
    </div>
    
    {showLogSheet && currentUserHabit && (
      <LogSheet 
        habit={currentUserHabit} 
        onClose={() => setShowLogSheet(false)} 
        onLog={() => {
          setShowLogSheet(false)
          fetchAllEvents()
        }} 
      />
    )}
    </>
  )
}