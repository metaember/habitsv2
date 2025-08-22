import { describe, it, expect } from 'vitest'
import { buildStreak, timeSinceLastFailure, onPace } from '@/lib/stats'

describe('stats', () => {
  it('should calculate time since last failure correctly', () => {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    const events = [
      { tsClient: threeDaysAgo.toISOString(), value: 1 }
    ]
    
    const result = timeSinceLastFailure(events, 'America/New_York')
    expect(result).toBe(3)
  })

  it('should determine if user is on pace correctly', () => {
    const now = new Date('2023-05-15T12:00:00Z')
    const start = new Date('2023-05-01T00:00:00Z')
    const end = new Date('2023-05-31T00:00:00Z')
    
    // Halfway through the period, achieved half the target
    const result = onPace(now, start, end, 5, 10)
    expect(result).toBe(true)
    
    // Halfway through the period, achieved less than half the target
    const result2 = onPace(now, start, end, 3, 10)
    expect(result2).toBe(false)
  })

  it('should handle edge cases for onPace', () => {
    const now = new Date('2023-05-15T12:00:00Z')
    const start = new Date('2023-05-01T00:00:00Z')
    const end = new Date('2023-05-01T00:00:00Z') // Same as start
    
    // When start and end are the same, should return false
    const result = onPace(now, start, end, 5, 10)
    expect(result).toBe(false)
  })

  it('should calculate time since last failure with no events', () => {
    const events: any[] = []
    
    const result = timeSinceLastFailure(events, 'America/New_York')
    expect(result).toBe(0)
  })
}))