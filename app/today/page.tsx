'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import HabitCard from '@/components/HabitCard'
import StatStrip from '@/components/StatStrip'
import { Button } from '@/components/ui/button'
import NewHabitForm from '@/components/NewHabitForm'
import Link from 'next/link'

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewHabitForm, setShowNewHabitForm] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      
      if (!res.ok) {
        console.error('API error:', data)
        setHabits([])
      } else if (Array.isArray(data)) {
        // Filter to only show active habits
        const activeHabits = data.filter((h: Habit) => h.active)
        setHabits(activeHabits)
      } else {
        console.error('Unexpected data format:', data)
        setHabits([])
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error)
      setHabits([])
    } finally {
      setLoading(false)
    }
  }

  const handleNewHabitSuccess = () => {
    setShowNewHabitForm(false)
    fetchHabits() // Refresh the habits list
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Today</h1>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/habits"
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-3 rounded-full transition-all duration-200 hover:scale-105"
              title="Manage habits"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Link>
            <button
              onClick={() => setShowNewHabitForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        <StatStrip />
        
        {habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Start your journey</h3>
            <p className="text-slate-500 mb-6">Create your first habit to begin tracking your progress</p>
            <button
              onClick={() => setShowNewHabitForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        )}
        
        {showNewHabitForm && (
          <NewHabitForm 
            onSuccess={handleNewHabitSuccess} 
            onCancel={() => setShowNewHabitForm(false)} 
          />
        )}
      </div>
    </div>
  )
}