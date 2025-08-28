'use client'

import { Habit, Event } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getHabitStats } from '@/lib/stats'
import { getCurrentPeriod } from '@/lib/period'

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

      {/* Per-user progress rings */}
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

          return (
            <div key={habit.id} className="flex items-center space-x-3">
              {/* User avatar */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                style={{ backgroundColor: userColor }}
              >
                {userInitials}
              </div>

              {/* Progress ring */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{userName}</span>
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

              {/* Quick log button */}
              <button
                onClick={() => {
                  // TODO: Implement quick log for specific user's habit
                  toast.success('Quick log feature coming soon!')
                }}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
      )}

      {/* Summary stats */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            {habits.length} member{habits.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-500">
            {loading ? '...' : habits.reduce((total, habit) => {
              const events = habitEvents[habit.id] || []
              const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
              return total + stats.currentPeriodProgress
            }, 0)} total {unitDisplay}
          </span>
        </div>
      </div>
    </div>
  )
}