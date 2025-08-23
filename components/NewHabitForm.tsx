'use client'

import { useState } from 'react'
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-xl font-bold text-slate-900">Create New Habit</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Name and Emoji */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Habit Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Drink water"
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="💧"
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl"
                maxLength={2}
              />
            </div>
          </div>
          
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Habit Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('build')}
                className={`p-4 rounded-xl font-medium transition-all ${
                  type === 'build'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Build</span>
                </div>
                <p className="text-xs mt-1 opacity-75">Create positive habits</p>
              </button>
              <button
                type="button"
                onClick={() => setType('break')}
                className={`p-4 rounded-xl font-medium transition-all ${
                  type === 'break'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Break</span>
                </div>
                <p className="text-xs mt-1 opacity-75">Stop negative habits</p>
              </button>
            </div>
          </div>
          
          {/* Target and Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target
              </label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          
          {/* Unit Selection for Build Habits */}
          {type === 'build' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="count">Count</option>
                  <option value="minutes">Minutes</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {unit === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Custom Unit Label
                  </label>
                  <input
                    type="text"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="e.g., glasses, pages, miles"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </>
          )}
          
          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}