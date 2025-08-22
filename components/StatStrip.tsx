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
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Today&apos;s Progress</p>
          <p className="text-lg font-semibold">
            {stats.totalOnTrack}/{stats.totalHabits} on track
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Overall</p>
          <p className={`text-lg font-semibold ${
            stats.onTrackPercentage >= 75 ? 'text-green-600' : 
            stats.onTrackPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {stats.onTrackPercentage}% on-pace
          </p>
        </div>
      </div>
      {stats.activeStreaks > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {stats.activeStreaks} active {stats.activeStreaks === 1 ? 'streak' : 'streaks'}
          </p>
        </div>
      )}
    </div>
  )
}