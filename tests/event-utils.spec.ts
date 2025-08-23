import { describe, it, expect } from 'vitest'
import { isVoidEvent, getVoidedEventId, filterEffectiveEvents } from '@/lib/event-utils'

describe('event-utils', () => {
  it('should identify void events correctly', () => {
    const voidEvent = {
      meta: {
        kind: 'void',
        void_of: 'event-id'
      }
    }
    
    const regularEvent = {
      id: 'event-id',
      value: 1
    }
    
    expect(isVoidEvent(voidEvent)).toBe(true)
    expect(isVoidEvent(regularEvent)).toBe(false)
  })

  it('should get voided event ID correctly', () => {
    const voidEvent = {
      meta: {
        kind: 'void',
        void_of: 'event-id'
      }
    }
    
    const regularEvent = {
      id: 'event-id',
      value: 1
    }
    
    expect(getVoidedEventId(voidEvent)).toBe('event-id')
    expect(getVoidedEventId(regularEvent)).toBeNull()
  })

  it('should filter effective events correctly', () => {
    const events = [
      { id: '1', value: 1 },
      { id: '2', value: 1 },
      { id: '3', meta: { kind: 'void', void_of: '1' } }, // Voids event '1'
      { id: '4', value: 1 }
    ]
    
    const effectiveEvents = filterEffectiveEvents(events)
    
    // Should filter out event '1' (voided) and event '3' (void control event)
    expect(effectiveEvents).toHaveLength(2)
    expect(effectiveEvents.some(e => e.id === '1')).toBe(false)
    expect(effectiveEvents.some(e => e.id === '3')).toBe(false)
    expect(effectiveEvents.some(e => e.id === '2')).toBe(true)
    expect(effectiveEvents.some(e => e.id === '4')).toBe(true)
  })

  it('should handle events with no meta field', () => {
    const events = [
      { id: '1', value: 1 },
      { id: '2', value: 1, meta: null }
    ]
    
    const effectiveEvents = filterEffectiveEvents(events)
    
    expect(effectiveEvents).toHaveLength(2)
    expect(effectiveEvents.some(e => e.id === '1')).toBe(true)
    expect(effectiveEvents.some(e => e.id === '2')).toBe(true)
  })

  it('should handle events with non-object meta field', () => {
    const events = [
      { id: '1', value: 1, meta: 'string' },
      { id: '2', value: 1, meta: 123 }
    ]
    
    const effectiveEvents = filterEffectiveEvents(events)
    
    expect(effectiveEvents).toHaveLength(2)
    expect(effectiveEvents.some(e => e.id === '1')).toBe(true)
    expect(effectiveEvents.some(e => e.id === '2')).toBe(true)
  })
})