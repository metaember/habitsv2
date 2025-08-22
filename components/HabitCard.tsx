'use client'

import { Habit, Event } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import LogSheet from '@/components/LogSheet'
import { toast } from 'react-hot-toast'
import { getHabitStats } from '@/lib/stats'
import { getCurrentPeriod } from '@/lib/period'
import Link from 'next/link'

interface HabitCardProps {
  habit: Habit
}

export default function HabitCard({ habit }: HabitCardProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogSheet, setShowLogSheet] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [habit.id])

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/habits/${habit.id}/events`)
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const stats = getHabitStats(habit, events, 'America/New_York', 'MON')
  const currentPeriod = getCurrentPeriod(habit.period, 'America/New_York', 'MON')
  
  // Calculate progress percentage for build habits
  const progressPercentage = habit.type === 'build' 
    ? Math.min(100, (stats.currentPeriodProgress / habit.target) * 100)
    : 0

  // Format period label
  const periodLabel = {
    day: 'today',
    week: 'this week',
    month: 'this month',
    custom: 'this period'
  }[habit.period]

  const handleQuickLog = async () => {
    try {
      const res = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1 })
      })
      
      if (!res.ok) throw new Error('Failed to log event')
      
      await fetchEvents()
      toast.success('Logged successfully!')
    } catch (error) {
      console.error('Failed to log event:', error)
      toast.error('Failed to log event')
    }
  }

  const handleLogSuccess = () => {
    setShowLogSheet(false)
    fetchEvents()
  }

  return (
    <>
      <Link href={`/habit/${habit.id}`}>
        <Card className="w-full hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {habit.emoji && <span className="text-2xl">{habit.emoji}</span>}
              <span>{habit.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {habit.type === 'build' 
                    ? `${stats.currentPeriodProgress}/${habit.target} ${periodLabel}` 
                    : 'Break habit'}
                </p>
                {habit.type === 'build' && (
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.isOnPace ? 'On track' : 'At risk'}
                  </p>
                )}
              </div>
              <div>
                {habit.type === 'build' ? (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Streak: {stats.streak}
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Clean: {stats.timeSinceLastFailure || 0} days
                  </span>
                )}
              </div>
            </div>
            
            {habit.type === 'build' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className={`h-2.5 rounded-full transition-all ${
                    stats.isOnPace ? 'bg-blue-600' : 'bg-orange-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
            
            <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
              <Button 
                onClick={handleQuickLog}
                className="flex-1"
                variant={habit.type === 'build' ? 'default' : 'destructive'}
                disabled={loading}
              >
                {habit.type === 'build' ? '+1' : 'Log Incident'}
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setShowLogSheet(true)
                }}
                variant="outline"
                size="icon"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      {showLogSheet && (
        <LogSheet 
          habit={habit} 
          onClose={() => setShowLogSheet(false)} 
          onLog={handleLogSuccess} 
        />
      )}
    </>
  )
}