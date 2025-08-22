'use client'

import { useEffect, useState } from 'react'
import { Habit, Event } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function HabitDetailPage({ params }: { params: { id: string } }) {
  const [habit, setHabit] = useState<Habit | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHabit()
    fetchEvents()
  }, [params.id])

  const fetchHabit = async () => {
    try {
      const res = await fetch(`/api/habits`)
      const data = await res.json()
      // Find the habit with the matching ID
      const foundHabit = data.find((h: Habit) => h.id === params.id)
      setHabit(foundHabit || null)
    } catch (error) {
      console.error('Failed to fetch habit:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/habits/${params.id}/events`)
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
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
        // Refresh events after voiding
        fetchEvents()
        toast.success('Event undone successfully!')
      } else {
        toast.error('Failed to undo event')
      }
    } catch (error) {
      console.error('Failed to void event:', error)
      toast.error('Failed to undo event')
    }
  }

  // Check if an event is voided
  const isEventVoided = (eventId: string) => {
    return events.some(event => 
      event.meta && 
      typeof event.meta === 'object' && 
      'void_of' in event.meta && 
      event.meta.void_of === eventId
    )
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (!habit) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/today" className="text-blue-500 hover:underline">
            ← Back to Today
          </Link>
        </div>
        <p>Habit not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Link href="/today" className="text-blue-500 hover:underline">
          ← Back to Today
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {habit.emoji && <span>{habit.emoji}</span>}
            <span>{habit.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{habit.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target</p>
              <p className="font-medium">{habit.target} per {habit.period}</p>
            </div>
            {habit.unit !== 'count' && (
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">{habit.unitLabel || habit.unit}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {habit.type === 'build' ? 'Current Streak' : 'Time since last failure'}
              </p>
              <p className="text-2xl font-bold">
                {habit.type === 'build' ? '0 days' : '0 days'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">30-day adherence</p>
              <p className="text-2xl font-bold">0%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-gray-500">No events yet</p>
          ) : (
            <ul className="space-y-2">
              {events
                .filter(event => !(
                  event.meta && 
                  typeof event.meta === 'object' && 
                  'kind' in event.meta && 
                  event.meta.kind === 'void'
                ))
                .map((event) => (
                  <li key={event.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p>{new Date(event.tsClient).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Value: {event.value}</p>
                      {event.note && <p className="text-sm text-gray-500">Note: {event.note}</p>}
                      {isEventVoided(event.id) && (
                        <p className="text-sm text-red-500">Corrected</p>
                      )}
                    </div>
                    {!isEventVoided(event.id) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVoidEvent(event.id)}
                      >
                        Undo
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}