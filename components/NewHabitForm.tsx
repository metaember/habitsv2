'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface NewHabitFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function NewHabitForm({ onSuccess, onCancel }: NewHabitFormProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [type, setType] = useState<'build' | 'break'>('build')
  const [target, setTarget] = useState(1)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('day')
  const [unit, setUnit] = useState<'count' | 'minutes' | 'custom'>('count')
  const [unitLabel, setUnitLabel] = useState('')
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          emoji: emoji || undefined,
          type,
          target,
          period,
          unit,
          unitLabel: unitLabel || undefined,
        }),
      })

      if (res.ok) {
        toast.success('Habit created successfully!')
        onSuccess()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error?.message || 'Failed to create habit')
      }
    } catch (error) {
      toast.error('Failed to create habit')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Habit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Drink water"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="emoji">Emoji (optional)</Label>
              <Input
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="e.g., 💧"
              />
            </div>
            
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={type === 'build' ? 'default' : 'outline'}
                  onClick={() => setType('build')}
                  className="flex-1"
                >
                  Build
                </Button>
                <Button
                  type="button"
                  variant={type === 'break' ? 'default' : 'outline'}
                  onClick={() => setType('break')}
                  className="flex-1"
                >
                  Break
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="period">Period</Label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            {type === 'build' && (
              <>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="count">Count</option>
                    <option value="minutes">Minutes</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                {unit !== 'count' && (
                  <div>
                    <Label htmlFor="unitLabel">Unit Label</Label>
                    <Input
                      id="unitLabel"
                      value={unitLabel}
                      onChange={(e) => setUnitLabel(e.target.value)}
                      placeholder="e.g., glasses, pages"
                    />
                  </div>
                )}
              </>
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
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? 'Creating...' : 'Create Habit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}