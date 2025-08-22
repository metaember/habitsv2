import { describe, it, expect } from 'vitest'
import { periodRange, groupEventsByPeriod } from '@/lib/period'

describe('period', () => {
  it('should calculate daily period range correctly', () => {
    const now = new Date('2023-05-15T10:00:00Z')
    const result = periodRange(now, 'day', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-15T00:00:00Z'))
    expect(result.end).toEqual(new Date('2023-05-16T00:00:00Z'))
  })

  it('should calculate weekly period range correctly (MON)', () => {
    const now = new Date('2023-05-15T10:00:00Z') // Monday
    const result = periodRange(now, 'week', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-15T00:00:00Z'))
    expect(result.end).toEqual(new Date('2023-05-22T00:00:00Z'))
  })

  it('should calculate weekly period range correctly (SUN)', () => {
    const now = new Date('2023-05-15T10:00:00Z') // Monday
    const result = periodRange(now, 'week', 'SUN', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-14T00:00:00Z'))
    expect(result.end).toEqual(new Date('2023-05-21T00:00:00Z'))
  })

  it('should calculate monthly period range correctly', () => {
    const now = new Date('2023-05-15T10:00:00Z')
    const result = periodRange(now, 'month', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-05-01T00:00:00Z'))
    expect(result.end).toEqual(new Date('2023-06-01T00:00:00Z'))
  })

  it('should group events by period correctly', () => {
    const events = [
      { id: '1', tsClient: new Date('2023-05-15T10:00:00Z').toISOString() },
      { id: '2', tsClient: new Date('2023-05-15T15:00:00Z').toISOString() },
      { id: '3', tsClient: new Date('2023-05-16T10:00:00Z').toISOString() }
    ]
    
    const grouped = groupEventsByPeriod(events, 'day', 'America/New_York')
    
    expect(Object.keys(grouped)).toHaveLength(2)
    expect(grouped[`${new Date('2023-05-15T10:00:00Z').getFullYear()}-${new Date('2023-05-15T10:00:00Z').getMonth()}-${new Date('2023-05-15T10:00:00Z').getDate()}`]).toHaveLength(2)
    expect(grouped[`${new Date('2023-05-16T10:00:00Z').getFullYear()}-${new Date('2023-05-16T10:00:00Z').getMonth()}-${new Date('2023-05-16T10:00:00Z').getDate()}`]).toHaveLength(1)
  })

  it('should handle DST transitions correctly', () => {
    // DST forward transition (March 12, 2023 in New York)
    const dstForward = new Date('2023-03-12T10:00:00Z')
    const result = periodRange(dstForward, 'day', 'MON', 'America/New_York')
    
    expect(result.start).toEqual(new Date('2023-03-12T00:00:00Z'))
    expect(result.end).toEqual(new Date('2023-03-13T00:00:00Z'))
  })
}))