'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import NewHabitForm from '@/components/NewHabitForm'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function AllHabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewHabitForm, setShowNewHabitForm] = useState(false)
  const [orderIds, setOrderIds] = useState<string[]>([])

  useEffect(() => {
    fetchHabits()
    // Load saved order from localStorage
    const savedOrder = localStorage.getItem('habitOrder')
    if (savedOrder) {
      setOrderIds(JSON.parse(savedOrder))
    }
  }, [])

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits')
      const data = await res.json()
      setHabits(data)
      
      // Initialize order if not set
      const savedOrder = localStorage.getItem('habitOrder')
      if (!savedOrder) {
        const ids = data.map((h: Habit) => h.id)
        setOrderIds(ids)
        localStorage.setItem('habitOrder', JSON.stringify(ids))
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error)
      toast.error('Failed to load habits')
    } finally {
      setLoading(false)
    }
  }

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderIds]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    
    // Swap positions
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    
    setOrderIds(newOrder)
    localStorage.setItem('habitOrder', JSON.stringify(newOrder))
  }

  const toggleHabitActive = async (id: string, currentActive: boolean) => {
    try {
      // Update local state immediately for responsiveness
      setHabits(habits.map(habit => 
        habit.id === id ? { ...habit, active: !currentActive } : habit
      ))
      
      // Call API to persist the change
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update habit')
      }
      
      toast.success(currentActive ? 'Habit archived' : 'Habit restored')
    } catch (error) {
      // Revert on error
      setHabits(habits.map(habit => 
        habit.id === id ? { ...habit, active: currentActive } : habit
      ))
      console.error('Failed to toggle habit:', error)
      toast.error('Failed to update habit')
    }
  }

  const handleNewHabitSuccess = () => {
    setShowNewHabitForm(false)
    fetchHabits() // Refresh the habits list
  }

  // Sort habits based on saved order
  const sortedHabits = [...habits].sort((a, b) => {
    const aIndex = orderIds.indexOf(a.id)
    const bIndex = orderIds.indexOf(b.id)
    
    // If not in order array, put at end
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })

  // Separate active and archived
  const activeHabits = sortedHabits.filter(h => h.active)
  const archivedHabits = sortedHabits.filter(h => !h.active)

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Habits</h1>
        <Button onClick={() => setShowNewHabitForm(true)}>+ New Habit</Button>
      </div>
      
      {/* Active Habits */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Active Habits</h2>
        {activeHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No active habits yet</p>
            <Button onClick={() => setShowNewHabitForm(true)}>Create your first habit</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeHabits.map((habit) => {
              const actualIndex = orderIds.indexOf(habit.id)
              return (
                <div
                  key={habit.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
                >
                  <Link 
                    href={`/habit/${habit.id}`}
                    className="flex items-center gap-3 flex-grow"
                  >
                    <span className="text-xl">{habit.emoji || '⭐'}</span>
                    <div>
                      <h3 className="font-medium">{habit.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {habit.type} • {habit.target} per {habit.period}
                      </p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => moveHabit(actualIndex, 'up')}
                      disabled={actualIndex === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveHabit(actualIndex, 'down')}
                      disabled={actualIndex === orderIds.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Archive button */}
                    <button
                      onClick={() => toggleHabitActive(habit.id, habit.active)}
                      className="p-1 rounded hover:bg-gray-100 ml-2"
                      aria-label="Archive habit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Archived Habits</h2>
          <div className="space-y-2 opacity-60">
            {archivedHabits.map((habit) => (
              <div
                key={habit.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <Link 
                  href={`/habit/${habit.id}`}
                  className="flex items-center gap-3 flex-grow"
                >
                  <span className="text-xl">{habit.emoji || '⭐'}</span>
                  <div>
                    <h3 className="font-medium">{habit.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {habit.type} • {habit.target} per {habit.period}
                    </p>
                  </div>
                </Link>
                
                <button
                  onClick={() => toggleHabitActive(habit.id, habit.active)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="Restore habit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showNewHabitForm && (
        <NewHabitForm 
          onSuccess={handleNewHabitSuccess} 
          onCancel={() => setShowNewHabitForm(false)} 
        />
      )}
    </div>
  )
}