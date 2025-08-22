'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import NewHabitForm from '@/components/NewHabitForm'

export default function AllHabitsPage() {
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
      setHabits(data)
    } catch (error) {
      console.error('Failed to fetch habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHabitActive = async (id: string, currentActive: boolean) => {
    try {
      // In a real implementation, you would call an API to update the habit
      // For now, we'll just update the local state
      setHabits(habits.map(habit => 
        habit.id === id ? { ...habit, active: !currentActive } : habit
      ))
    } catch (error) {
      console.error('Failed to toggle habit:', error)
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
        <h1 className="text-2xl font-bold">All Habits</h1>
        <Button onClick={() => setShowNewHabitForm(true)}>New Habit</Button>
      </div>
      
      {habits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No habits yet</p>
          <Button onClick={() => setShowNewHabitForm(true)}>Create your first habit</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <Card key={habit.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {habit.emoji && <span>{habit.emoji}</span>}
                    <span>{habit.name}</span>
                  </div>
                  <Switch
                    checked={habit.active}
                    onCheckedChange={() => toggleHabitActive(habit.id, habit.active)}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">
                    {habit.type} • {habit.target} per {habit.period}
                  </p>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>
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