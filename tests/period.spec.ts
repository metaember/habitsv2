import { describe, it, expect } from 'vitest'
import { periodRange, groupEventsByPeriod } from '@/lib/period'

describe('period', () => {
  it('should calculate daily period range correctly', () => {
    const now = new Date('2023-05-15T10:00:00Z')
    const result = periodRange(now, 'day', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-15T04:00:00Z')) // 00:00 EDT = 04:00 UTC
    expect(result.end).toEqual(new Date('2023-05-16T04:00:00Z'))
  })

  it('should calculate weekly period range correctly (MON)', () => {
    const now = new Date('2023-05-15T10:00:00Z') // Monday
    const result = periodRange(now, 'week', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-15T04:00:00Z'))
    expect(result.end).toEqual(new Date('2023-05-22T04:00:00Z'))
  })

  it('should calculate weekly period range correctly (SUN)', () => {
    const now = new Date('2023-05-15T10:00:00Z') // Monday
    const result = periodRange(now, 'week', 'SUN', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-14T04:00:00Z'))
    expect(result.end).toEqual(new Date('2023-05-21T04:00:00Z'))
  })

  it('should calculate monthly period range correctly', () => {
    const now = new Date('2023-05-15T10:00:00Z')
    const result = periodRange(now, 'month', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-01T04:00:00Z'))
    expect(result.end).toEqual(new Date('2023-06-01T04:00:00Z'))
  })

  it('should group events by period correctly', () => {
    const events = [
      { id: '1', tsClient: new Date('2023-05-15T10:00:00Z').toISOString() },
      { id: '2', tsClient: new Date('2023-05-15T15:00:00Z').toISOString() },
      { id: '3', tsClient: new Date('2023-05-16T10:00:00Z').toISOString() }
    ]
    
    const grouped = groupEventsByPeriod(events, 'day', 'America/New_York', 'MON')
    
    expect(Object.keys(grouped).length).toBeGreaterThan(0)
  })

  it('should handle DST transitions correctly', () => {
    // DST forward transition (March 12, 2023 in New York)
    const dstForward = new Date('2023-03-12T10:00:00Z')
    const result = periodRange(dstForward, 'day', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-03-12T05:00:00Z')) // EST = UTC-5
    expect(result.end).toEqual(new Date('2023-03-13T04:00:00Z')) // EDT = UTC-4
  })
})