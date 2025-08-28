// Helper function to check if an event is a void event
export function isVoidEvent(event: any): boolean {
  return !!(event.meta && event.meta.kind === 'void')
}

// Helper function to get the ID of the event that was voided
export function getVoidedEventId(event: any): string | null {
  if (isVoidEvent(event) && event.meta.void_of) {
    return event.meta.void_of
  }
  return null
}

// Filter out voided events and control events
export function filterEffectiveEvents(events: any[]): any[] {
  // First, collect all voided event IDs
  const voidedIds = new Set<string>()
  events.forEach(event => {
    const voidedId = getVoidedEventId(event)
    if (voidedId) {
      voidedIds.add(voidedId)
    }
  })

  // Filter out events that are either voided or are control events
  return events.filter(event => {
    // Exclude control events where meta.kind === 'void'
    if (isVoidEvent(event)) {
      return false
    }
    
    // Exclude events whose id is in voidedIds
    if (voidedIds.has(event.id)) {
      return false
    }
    
    return true
  })
}

/**
 * Group events by date (YYYY-MM-DD)
 */
export function groupEventsByDate(events: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  
  events.forEach(event => {
    const date = new Date(event.tsClient).toISOString().split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
  })
  
  return groups
}