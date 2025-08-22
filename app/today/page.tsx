'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import HabitCard from '@/components/HabitCard'
import StatStrip from '@/components/StatStrip'
import { Button } from '@/components/ui/button'
import NewHabitForm from '@/components/NewHabitForm'

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
        setHabits(data)
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Today</h1>
        <Button onClick={() => setShowNewHabitForm(true)}>New Habit</Button>
      </div>
      
      <StatStrip />
      
      {habits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No habits yet</p>
          <Button onClick={() => setShowNewHabitForm(true)}>Create your first habit</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
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
  )
}