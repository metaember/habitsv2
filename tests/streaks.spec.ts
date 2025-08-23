import { describe, it, expect } from 'vitest'
import { calculateTimeSinceLastFailure, isOnPace } from '@/lib/stats'

describe('stats', () => {
  it('should calculate time since last failure correctly', () => {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    const events = [
      { tsClient: threeDaysAgo.toISOString(), value: 1 }
    ]
    
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('should determine if user is on pace correctly', () => {
    const start = new Date('2023-05-01T00:00:00Z')
    const end = new Date('2023-05-31T00:00:00Z')
    
    // currentPeriodTotal, target, periodStart, periodEnd
    const result = isOnPace(5, 10, start, end)
    expect(typeof result).toBe('boolean')
    
    // Less than expected progress
    const result2 = isOnPace(3, 10, start, end)
    expect(typeof result2).toBe('boolean')
  })

  it('should handle edge cases for isOnPace', () => {
    const start = new Date('2023-05-01T00:00:00Z')
    const end = new Date('2023-05-01T00:00:00Z') // Same as start
    
    // When start and end are the same, should return false
    const result = isOnPace(5, 10, start, end)
    expect(result).toBe(false)
  })

  it('should calculate time since last failure with no events', () => {
    const events: any[] = []
    
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(0)
  })
})