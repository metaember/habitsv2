'use client'

import { useState, useEffect } from 'react'
import { Habit, Event } from '@prisma/client'
import { getHabitStats } from '@/lib/stats'

export default function StatStrip() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [events, setEvents] = useState<Record<string, Event[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all habits
      const habitsRes = await fetch('/api/habits')
      const habitsData = await habitsRes.json()
      
      if (!habitsRes.ok || !Array.isArray(habitsData)) {
        console.error('Failed to fetch habits:', habitsData)
        setHabits([])
        setEvents({})
        return
      }
      
      setHabits(habitsData)

      // Fetch events for each habit
      const eventsData: Record<string, Event[]> = {}
      await Promise.all(
        habitsData.map(async (habit: Habit) => {
          const res = await fetch(`/api/habits/${habit.id}/events`)
          const data = await res.json()
          if (res.ok && Array.isArray(data)) {
            eventsData[habit.id] = data
          } else {
            eventsData[habit.id] = []
          }
        })
      )
      setEvents(eventsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate aggregate stats
  const calculateAggregateStats = () => {
    let totalOnTrack = 0
    let totalHabits = 0
    let activeStreaks = 0

    habits.forEach(habit => {
      const habitEvents = events[habit.id] || []
      const stats = getHabitStats(habit, habitEvents, 'America/New_York', 'MON')
      
      totalHabits++
      if (stats.isOnPace) totalOnTrack++
      if (habit.type === 'build' && stats.streak > 0) activeStreaks++
    })

    return {
      onTrackPercentage: totalHabits > 0 ? Math.round((totalOnTrack / totalHabits) * 100) : 0,
      totalOnTrack,
      totalHabits,
      activeStreaks
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-12"></div>
      </div>
    )
  }

  const stats = calculateAggregateStats()

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 mb-6 shadow-xl shadow-slate-200/20">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Progress</p>
          <p className="text-2xl font-bold text-slate-900">
            {stats.totalOnTrack}<span className="text-slate-400">/{stats.totalHabits}</span>
          </p>
          <p className="text-sm text-slate-500">habits on track</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold ${
            stats.onTrackPercentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 
            stats.onTrackPercentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {stats.onTrackPercentage}% on-pace
          </div>
        </div>
      </div>
      {stats.activeStreaks > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-slate-600 font-medium">
              {stats.activeStreaks} active {stats.activeStreaks === 1 ? 'streak' : 'streaks'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}