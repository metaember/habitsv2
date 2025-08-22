'use client'

import { useState } from 'react'
import { Habit, HabitType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

interface LogSheetProps {
  habit: Habit
  onClose: () => void
  onLog: () => void
}

export default function LogSheet({ habit, onClose, onLog }: LogSheetProps) {
  const [value, setValue] = useState(1)
  const [note, setNote] = useState('')
  const [logging, setLogging] = useState(false)

  const handleLog = async () => {
    setLogging(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: habit.type === 'break' ? 1 : value,
          note,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onLog()
        onClose()
        
        // Show success message with undo option
        toast.success(
          <div className="flex items-center justify-between">
            <span>Event logged successfully!</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={async () => {
                // Void the event
                try {
                  const voidRes = await fetch(`/api/events/${data.eventId}/void`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      reason: 'mistap'
                    }),
                  })
                  
                  if (voidRes.ok) {
                    toast.success('Event undone!')
                    onLog() // Refresh the events
                  } else {
                    toast.error('Failed to undo event')
                  }
                } catch (error) {
                  toast.error('Failed to undo event')
                }
                toast.dismiss()
              }}
            >
              Undo
            </Button>
          </div>,
          { duration: 10000 }
        )
      } else {
        toast.error('Failed to log event')
      }
    } catch (error) {
      toast.error('Failed to log event')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {habit.emoji && <span>{habit.emoji}</span>}
            <span>Log: {habit.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {habit.type === 'build' && (
            <div>
              <Label htmlFor="value">Value</Label>
              <input
                id="value"
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleLog} 
              className="flex-1"
              disabled={logging}
            >
              {logging ? 'Logging...' : habit.type === 'build' ? 'Log' : 'Log Incident'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}