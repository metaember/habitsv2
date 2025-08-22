'use client'

import { Habit, Event } from '@prisma/client'
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
      <Link href={`/habit/${habit.id}`} className="block">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300 hover:scale-[1.02]">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{habit.emoji || '⭐'}</div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{habit.name}</h3>
                <p className="text-sm text-slate-500">
                  {habit.type === 'build' 
                    ? `${stats.currentPeriodProgress}/${habit.target} ${periodLabel}` 
                    : 'Break habit'}
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            {habit.type === 'build' ? (
              <div className="flex flex-col items-end gap-2">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stats.isOnPace 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {stats.isOnPace ? 'On track' : 'At risk'}
                </div>
                <div className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  {stats.streak} day streak
                </div>
              </div>
            ) : (
              <div className="bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
                {stats.timeSinceLastFailure || 0} days clean
              </div>
            )}
          </div>
          
          {/* Progress Bar for Build Habits */}
          {habit.type === 'build' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.isOnPace 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div 
            className="flex gap-3" 
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={handleQuickLog}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                habit.type === 'build'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
              }`}
            >
              {habit.type === 'build' ? '+1' : 'Log Incident'}
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowLogSheet(true)
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
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