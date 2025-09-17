'use client'

import { useEffect, useState } from 'react'
import { Habit, Event, User } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { getHabitStats } from '@/lib/stats'
import GroupMonthCalendar from '@/components/GroupMonthCalendar'

interface HabitWithOwner extends Habit {
  owner?: {
    id: string
    name: string
    color?: string
  }
}

interface GroupHabitData {
  habits: HabitWithOwner[]
  events: { [habitId: string]: Event[] }
}

export default function GroupHabitDetailPage({ params }: { params: { templateKey: string } }) {
  const [groupData, setGroupData] = useState<GroupHabitData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupHabitData()
  }, [params.templateKey])

  const fetchGroupHabitData = async () => {
    try {
      const habitsRes = await fetch('/api/habits')
      const allHabits = await habitsRes.json()
      
      const groupHabits = allHabits.filter((h: any) => 
        h.templateKey === params.templateKey && h.visibility === 'household'
      )
      
      if (groupHabits.length === 0) {
        setGroupData(null)
        setLoading(false)
        return
      }

      const eventPromises = groupHabits.map(async (habit: Habit) => {
        const res = await fetch(`/api/habits/${habit.id}/events`)
        const events = await res.json()
        return { habitId: habit.id, events }
      })
      
      const results = await Promise.all(eventPromises)
      const eventsMap: { [habitId: string]: Event[] } = {}
      
      results.forEach(({ habitId, events }) => {
        eventsMap[habitId] = events
      })
      
      setGroupData({
        habits: groupHabits,
        events: eventsMap
      })
    } catch (error) {
      console.error('Failed to fetch group habit data:', error)
      toast.error('Failed to load group habit data')
    } finally {
      setLoading(false)
    }
  }

  const handleVoidEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'mistap',
        }),
      })

      if (res.ok) {
        fetchGroupHabitData()
        toast.success('Event undone successfully!')
      } else {
        toast.error('Failed to undo event')
      }
    } catch (error) {
      console.error('Failed to void event:', error)
      toast.error('Failed to undo event')
    }
  }

  const handleQuickLog = async (habitId: string, userName: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: 1,
          source: 'ui',
          date: new Date().toISOString().split('T')[0]
        }),
      })

      if (response.ok) {
        toast.success(`Logged for ${userName}!`)
        fetchGroupHabitData()
      } else {
        toast.error('Failed to log event')
      }
    } catch (error) {
      toast.error('Failed to log event')
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (!groupData || groupData.habits.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/today" className="text-blue-500 hover:underline">
            ← Back to Today
          </Link>
        </div>
        <p>Group habit not found</p>
      </div>
    )
  }

  const primaryHabit = groupData.habits[0]
  const habitName = primaryHabit.name
  const habitEmoji = primaryHabit.emoji || '🎯'

  const periodLabel = {
    day: 'per day',
    week: 'per week',
    month: 'per month',
    custom: 'per period'
  }[primaryHabit.period] || 'per period'

  const unitDisplay = primaryHabit.unit === 'custom' && primaryHabit.unitLabel 
    ? primaryHabit.unitLabel 
    : primaryHabit.unit === 'minutes' 
      ? 'minutes' 
      : ''

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/today" className="text-blue-500 hover:underline">
          ← Back to Today
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {habitEmoji && <span className="text-3xl">{habitEmoji}</span>}
            <span>{habitName}</span>
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Household Habit
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{primaryHabit.type === 'build' ? '📈 Build' : '🚫 Break'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target</p>
              <p className="font-medium">
                {primaryHabit.target} {unitDisplay} {periodLabel}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="font-medium">{groupData.habits.length} people</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Member Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupData.habits.map((habit) => {
              const events = groupData.events[habit.id] || []
              const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
              const progressPercentage = habit.type === 'build' 
                ? Math.min(100, (stats.currentPeriodProgress / habit.target) * 100)
                : 0

              const userColor = habit.owner?.color || '#64748b'
              const userName = habit.owner?.name || 'Unknown User'
              const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()

              return (
                <div key={habit.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: userColor }}
                  >
                    {userInitials}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-700">{userName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">
                          {stats.currentPeriodProgress}
                          {habit.type === 'build' && `/${habit.target}`}
                          {unitDisplay && ` ${unitDisplay}`}
                        </span>
                        {habit.type === 'build' ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stats.isOnPace 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {stats.isOnPace ? 'On track' : 'At risk'}
                          </span>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stats.timeSinceLastFailure === 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {stats.timeSinceLastFailure || 0} days clean
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
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

                      <button
                        onClick={() => handleQuickLog(habit.id, userName)}
                        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>🔥 {stats.streak} day streak</span>
                      <span>📊 {Math.round(stats.adherenceRate)}% adherence</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Progress</span>
              <span className="font-medium text-slate-700">
                {groupData.habits.reduce((total, habit) => {
                  const events = groupData.events[habit.id] || []
                  const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
                  return total + stats.currentPeriodProgress
                }, 0)} {unitDisplay}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupMonthCalendar 
            habits={groupData.habits} 
            eventsMap={groupData.events}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Group Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const allEvents: Array<{event: Event, habitId: string, userName: string, userColor: string}> = []
            
            groupData.habits.forEach(habit => {
              const events = groupData.events[habit.id] || []
              events.forEach(event => {
                if (!(event.meta && typeof event.meta === 'object' && 'kind' in event.meta && event.meta.kind === 'void')) {
                  allEvents.push({
                    event,
                    habitId: habit.id,
                    userName: habit.owner?.name || 'Unknown',
                    userColor: habit.owner?.color || '#64748b'
                  })
                }
              })
            })

            allEvents.sort((a, b) => 
              new Date(b.event.tsClient).getTime() - new Date(a.event.tsClient).getTime()
            )

            const recentEvents = allEvents.slice(0, 10)

            if (recentEvents.length === 0) {
              return <p className="text-gray-500">No events yet</p>
            }

            return (
              <ul className="space-y-2">
                {recentEvents.map(({ event, habitId, userName, userColor }) => {
                  const isVoided = groupData.habits.some(h => 
                    (groupData.events[h.id] || []).some(e => 
                      e.meta && 
                      typeof e.meta === 'object' && 
                      'void_of' in e.meta && 
                      e.meta.void_of === event.id
                    )
                  )

                  return (
                    <li key={event.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: userColor }}
                        >
                          {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{userName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.tsClient).toLocaleString()} • {event.value} {unitDisplay}
                          </p>
                          {event.note && <p className="text-xs text-gray-500">Note: {event.note}</p>}
                          {isVoided && <p className="text-xs text-red-500">Corrected</p>}
                        </div>
                      </div>
                      {!isVoided && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVoidEvent(event.id)}
                        >
                          Undo
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}