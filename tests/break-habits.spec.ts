import { describe, it, expect } from 'vitest'
import { calculateTimeSinceLastFailure } from '@/lib/stats'
import { Event } from '@prisma/client'

describe('Break Habits with Voided Events', () => {
  const mockEvent = (id: string, value: number, tsClient: Date, meta: any = {}): Event => ({
    id,
    habitId: 'test-habit',
    value,
    note: null,
    tsClient,
    tsServer: tsClient,
    meta
  })

  it('should return 1 day clean when no events exist', () => {
    const events: Event[] = []
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
  })

  it('should return 0 days clean when failure occurred today', () => {
    const today = new Date()
    today.setHours(10, 0, 0, 0) // 10 AM today
    
    const events: Event[] = [
      mockEvent('event1', 1, today)
    ]
    
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(0)
  })

  it('should return 1 day clean when last failure was yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 0, 0, 0) // 10 AM yesterday
    
    const events: Event[] = [
      mockEvent('event1', 1, yesterday)
    ]
    
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
  })

  it('should return 3 days clean when last failure was 3 days ago', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(10, 0, 0, 0)
    
    const events: Event[] = [
      mockEvent('event1', 1, threeDaysAgo)
    ]
    
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(3)
  })

  it('should ignore voided events when calculating days clean', () => {
    const today = new Date()
    today.setHours(10, 0, 0, 0) // 10 AM today
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(15, 0, 0, 0) // 3 PM yesterday
    
    const events: Event[] = [
      // Failure today (but will be voided)
      mockEvent('event1', 1, today),
      // Failure yesterday (not voided)
      mockEvent('event2', 1, yesterday),
      // Void event that cancels today's failure
      mockEvent('void1', 0, today, { kind: 'void', void_of: 'event1', reason: 'mistap' })
    ]
    
    // Should return 1 day clean since today's failure is voided, 
    // so the last effective failure was yesterday
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
  })

  it('should return 1 day clean when all failures from today are voided', () => {
    const today = new Date()
    const morning = new Date(today)
    morning.setHours(8, 0, 0, 0)
    
    const afternoon = new Date(today)
    afternoon.setHours(14, 0, 0, 0)
    
    const events: Event[] = [
      // Two failures today
      mockEvent('event1', 1, morning),
      mockEvent('event2', 1, afternoon),
      // Both voided
      mockEvent('void1', 0, morning, { kind: 'void', void_of: 'event1', reason: 'mistap' }),
      mockEvent('void2', 0, afternoon, { kind: 'void', void_of: 'event2', reason: 'mistap' })
    ]
    
    // Should return 1 day clean since all today's failures are voided
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
  })

  it('should handle mixed voided and unvoided events correctly', () => {
    const today = new Date()
    const morning = new Date(today)
    morning.setHours(8, 0, 0, 0)
    
    const afternoon = new Date(today)
    afternoon.setHours(14, 0, 0, 0)
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)
    
    const events: Event[] = [
      // Failure yesterday (not voided)
      mockEvent('event1', 1, yesterday),
      // Failure this morning (voided)
      mockEvent('event2', 1, morning),
      // Failure this afternoon (not voided)
      mockEvent('event3', 1, afternoon),
      // Void only the morning failure
      mockEvent('void1', 0, morning, { kind: 'void', void_of: 'event2', reason: 'mistap' })
    ]
    
    // Should return 0 days clean since afternoon failure today is not voided
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(0)
  })

  it('should handle multiple void events correctly', () => {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    twoDaysAgo.setHours(10, 0, 0, 0)
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)
    
    const today = new Date()
    today.setHours(14, 0, 0, 0)
    
    const events: Event[] = [
      // Failure 2 days ago (not voided)
      mockEvent('event1', 1, twoDaysAgo),
      // Failure yesterday (voided)
      mockEvent('event2', 1, yesterday),
      // Failure today (voided)
      mockEvent('event3', 1, today),
      // Void events
      mockEvent('void1', 0, yesterday, { kind: 'void', void_of: 'event2', reason: 'mistap' }),
      mockEvent('void2', 0, today, { kind: 'void', void_of: 'event3', reason: 'mistap' })
    ]
    
    // Should return 2 days clean since the last unvoided failure was 2 days ago
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(2)
  })

  it('should ignore void control events in the calculation', () => {
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    
    const events: Event[] = [
      // Only void control events (no actual failures)
      mockEvent('void1', 0, today, { kind: 'void', void_of: 'some-nonexistent-event', reason: 'mistap' }),
      mockEvent('void2', 0, today, { kind: 'void', void_of: 'another-nonexistent-event', reason: 'mistap' })
    ]
    
    // Should return 1 day clean since there are no actual failure events
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
  })

  it('should handle events at day boundaries correctly', () => {
    const today = new Date()
    const endOfYesterday = new Date(today)
    endOfYesterday.setDate(endOfYesterday.getDate() - 1)
    endOfYesterday.setHours(23, 59, 59, 999) // Very end of yesterday
    
    const startOfToday = new Date(today)
    startOfToday.setHours(0, 0, 0, 0) // Very start of today
    
    const events: Event[] = [
      mockEvent('event1', 1, endOfYesterday)
    ]
    
    // Should return 1 day clean since failure was yesterday, not today
    const result = calculateTimeSinceLastFailure(events)
    expect(result).toBe(1)
    
    // Now test with failure at start of today
    const eventsToday: Event[] = [
      mockEvent('event2', 1, startOfToday)
    ]
    
    const resultToday = calculateTimeSinceLastFailure(eventsToday)
    expect(resultToday).toBe(0) // Should be 0 since failure was today
  })
})