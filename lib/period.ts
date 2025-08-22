/**
 * Period and timezone-aware helper functions.
 * These functions handle period calculations considering user timezones and DST.
 */

import { Period } from '@prisma/client'

export function periodRange(now: Date, period: Period, weekStart: 'MON' | 'SUN', tz: string): { start: Date; end: Date } {
  // Use Intl.DateTimeFormat to get local date parts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const dateParts: Record<string, number> = {}
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = parseInt(part.value)
    }
  })
  
  let start: Date, end: Date
  
  switch (period) {
    case 'day':
      // Start at midnight of current day in target timezone
      start = new Date(`${dateParts.year}-${String(dateParts.month).padStart(2, '0')}-${String(dateParts.day).padStart(2, '0')}T00:00:00`)
      end = new Date(start)
      end.setDate(end.getDate() + 1)
      break
      
    case 'week':
      // Get day of week (0 = Sunday)
      const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay()
      const daysToSubtract = weekStart === 'MON' 
        ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) // Monday start
        : dayOfWeek // Sunday start
      
      const weekStartDate = new Date(`${dateParts.year}-${String(dateParts.month).padStart(2, '0')}-${String(dateParts.day).padStart(2, '0')}T00:00:00`)
      weekStartDate.setDate(weekStartDate.getDate() - daysToSubtract)
      
      start = weekStartDate
      end = new Date(start)
      end.setDate(end.getDate() + 7)
      break
      
    case 'month':
      // Start at first day of month
      start = new Date(`${dateParts.year}-${String(dateParts.month).padStart(2, '0')}-01T00:00:00`)
      // End at first day of next month
      end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      break
      
    case 'custom':
      // For v0, treat custom as day
      start = new Date(`${dateParts.year}-${String(dateParts.month).padStart(2, '0')}-${String(dateParts.day).padStart(2, '0')}T00:00:00`)
      end = new Date(start)
      end.setDate(end.getDate() + 1)
      break
  }
  
  // Convert local times to UTC using the timezone offset
  const startStr = start.toLocaleString('en-US', { timeZone: tz, hour12: false }).replace(',', '')
  const endStr = end.toLocaleString('en-US', { timeZone: tz, hour12: false }).replace(',', '')
  
  // Create UTC dates by parsing the local time strings
  const utcStart = new Date(new Date(startStr).toISOString())
  const utcEnd = new Date(new Date(endStr).toISOString())
  
  return { start: utcStart, end: utcEnd }
}

export interface PeriodBucket {
  start: Date
  end: Date
  events: any[]
  total: number
  success?: boolean
}

export function groupEventsByPeriod(
  events: any[], 
  period: Period, 
  tz: string,
  weekStart: 'MON' | 'SUN' = 'MON'
): PeriodBucket[] {
  if (events.length === 0) return []
  
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.tsClient).getTime() - new Date(b.tsClient).getTime()
  )
  
  const buckets: PeriodBucket[] = []
  const bucketMap = new Map<string, PeriodBucket>()
  
  sortedEvents.forEach(event => {
    const eventDate = new Date(event.tsClient)
    const { start, end } = periodRange(eventDate, period, weekStart, tz)
    const key = start.toISOString()
    
    if (!bucketMap.has(key)) {
      const bucket: PeriodBucket = {
        start,
        end,
        events: [],
        total: 0
      }
      bucketMap.set(key, bucket)
      buckets.push(bucket)
    }
    
    const bucket = bucketMap.get(key)!
    bucket.events.push(event)
    bucket.total += event.value || 0
  })
  
  return buckets
}

export function getCurrentPeriod(period: Period, tz: string, weekStart: 'MON' | 'SUN' = 'MON'): { start: Date; end: Date } {
  return periodRange(new Date(), period, weekStart, tz)
}

export function isInCurrentPeriod(date: Date, period: Period, tz: string, weekStart: 'MON' | 'SUN' = 'MON'): boolean {
  const { start, end } = getCurrentPeriod(period, tz, weekStart)
  const time = date.getTime()
  return time >= start.getTime() && time < end.getTime()
}