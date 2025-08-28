/**
 * Statistics helper functions.
 * These functions calculate streaks, time since last failure, and on-pace metrics.
 */

import { HabitType, Period, Event, Habit } from '@prisma/client'
import { groupEventsByPeriod, getCurrentPeriod, periodRange } from './period'

export interface HabitStats {
  streak: number
  currentPeriodProgress: number
  isOnPace: boolean
  adherenceRate: number // Percentage for last 30 days
  timeSinceLastFailure?: number // Days for break habits
}

/**
 * Calculate streak for build habits (consecutive successful periods)
 */
export function calculateBuildStreak(
  events: Event[], 
  habit: Habit,
  tz: string,
  weekStart: 'MON' | 'SUN' = 'MON'
): number {
  const effectiveEvents = filterEffectiveEventsInline(events)
  if (effectiveEvents.length === 0) return 0
  
  const buckets = groupEventsByPeriod(effectiveEvents, habit.period, tz, weekStart)
  
  // Mark successful periods
  buckets.forEach(bucket => {
    bucket.success = bucket.total >= habit.target
  })
  
  // Calculate streak from most recent completed period backwards
  const now = new Date()
  const currentPeriod = getCurrentPeriod(habit.period, tz, weekStart)
  
  // Filter out current period (not yet complete)
  const completedBuckets = buckets.filter(b => b.end.getTime() <= now.getTime())
  
  // Remove this early return - we'll check after considering current period
  // if (completedBuckets.length === 0) return 0
  
  
  // Count consecutive successes from most recent, checking for gaps
  let streak = 0
  
  // Check if current period meets the target - if so, include it in streak calculation
  const currentPeriodBucket = buckets.find(b => 
    b.start.getTime() === currentPeriod.start.getTime() && 
    b.end.getTime() === currentPeriod.end.getTime()
  )
  
  const includeCurrentPeriod = currentPeriodBucket && currentPeriodBucket.success
  
  // Create a list of all buckets to consider (completed + current if successful)
  const bucketsToConsider = includeCurrentPeriod 
    ? [...completedBuckets, currentPeriodBucket!]
    : completedBuckets
  
  // Sort by start date descending
  bucketsToConsider.sort((a, b) => b.start.getTime() - a.start.getTime())
  
  if (bucketsToConsider.length === 0) return 0
  
  // Start checking from the most recent period
  const startDate = includeCurrentPeriod ? currentPeriod.start : new Date(currentPeriod.start.getTime() - 1)
  let checkingPeriod = periodRange(startDate, habit.period, weekStart, tz)
  let bucketIndex = 0
  
  while (bucketIndex < bucketsToConsider.length) {
    const bucket = bucketsToConsider[bucketIndex]
    
    // Check if this bucket matches the period we're checking
    if (bucket.start.getTime() === checkingPeriod.start.getTime()) {
      if (bucket.success) {
        streak++
        bucketIndex++
        
        // Move to previous period
        const prevDate = new Date(checkingPeriod.start)
        prevDate.setMilliseconds(prevDate.getMilliseconds() - 1)
        checkingPeriod = periodRange(prevDate, habit.period, weekStart, tz)
      } else {
        // Failed period breaks the streak
        break
      }
    } else if (bucket.start.getTime() > checkingPeriod.start.getTime()) {
      // We have a gap - no bucket for the period we're checking
      break
    } else {
      // This bucket is older than what we're checking, move to next bucket
      bucketIndex++
    }
  }
  
  return streak
}

/**
 * Calculate time since last failure for break habits
 * Returns the number of days clean, counting the current day optimistically
 */
export function calculateTimeSinceLastFailure(events: Event[], tz: string = 'America/New_York'): number {
  const now = new Date()
  
  // Filter out voided events first
  const effectiveEvents = filterEffectiveEventsInline(events)
  
  // If no effective events, count all days up to today as clean
  if (effectiveEvents.length === 0) return 1 // At least 1 day clean (today)
  
  // Find most recent effective event (which would be a failure for break habits)
  const sortedEvents = [...effectiveEvents].sort((a, b) => 
    new Date(b.tsClient).getTime() - new Date(a.tsClient).getTime()
  )
  
  const lastFailure = sortedEvents[0]
  if (!lastFailure) return 1
  
  const failureDate = new Date(lastFailure.tsClient)
  
  // Get today's start in the specified timezone (using a simple approach)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  
  // Check if the failure was today or later
  if (failureDate.getTime() >= todayStart.getTime()) {
    return 0 // Failed today, so 0 days clean
  }
  
  // Calculate difference in days from the start of the failure day
  const failureDayStart = new Date(failureDate)
  failureDayStart.setHours(0, 0, 0, 0)
  
  const diffMs = todayStart.getTime() - failureDayStart.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if habit is on pace for current period
 */
export function isOnPace(
  currentPeriodTotal: number,
  target: number,
  periodStart: Date,
  periodEnd: Date
): boolean {
  const now = new Date()
  
  // If we're past the period end, just check if target was met
  if (now.getTime() >= periodEnd.getTime()) {
    return currentPeriodTotal >= target
  }
  
  // Calculate elapsed fraction
  const totalTime = periodEnd.getTime() - periodStart.getTime()
  const elapsed = now.getTime() - periodStart.getTime()
  
  if (totalTime <= 0) return false
  
  const elapsedFraction = Math.min(1, elapsed / totalTime)
  
  // Check if on pace
  return currentPeriodTotal >= target * elapsedFraction
}

/**
 * Calculate adherence rate for last N days
 */
export function calculateAdherenceRate(
  events: Event[],
  habit: Habit,
  days: number,
  tz: string,
  weekStart: 'MON' | 'SUN' = 'MON'
): number {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  // Filter events within date range
  const relevantEvents = events.filter(e => {
    const eventDate = new Date(e.tsClient)
    return eventDate >= startDate && eventDate <= endDate
  })
  
  if (relevantEvents.length === 0) return 0
  
  // Group by period and check success
  const buckets = groupEventsByPeriod(relevantEvents, habit.period, tz, weekStart)
  
  // For build habits: success = meeting target
  // For break habits: success = no events in period
  if (habit.type === 'build') {
    buckets.forEach(bucket => {
      bucket.success = bucket.total >= habit.target
    })
  } else {
    // For break habits, we need to check all periods in range
    // A period with no events is successful
    const currentDate = new Date(startDate)
    const allPeriods: Array<{ start: Date; end: Date }> = []
    
    while (currentDate <= endDate) {
      const period = periodRange(currentDate, habit.period, weekStart, tz)
      allPeriods.push(period)
      
      // Move to next period
      currentDate.setTime(period.end.getTime())
    }
    
    // Count successful periods (those without events)
    let successfulPeriods = 0
    allPeriods.forEach(period => {
      const hasFailure = relevantEvents.some(event => {
        const eventTime = new Date(event.tsClient).getTime()
        return eventTime >= period.start.getTime() && eventTime < period.end.getTime()
      })
      if (!hasFailure) successfulPeriods++
    })
    
    return allPeriods.length > 0 ? (successfulPeriods / allPeriods.length) * 100 : 0
  }
  
  const successfulPeriods = buckets.filter(b => b.success).length
  return buckets.length > 0 ? (successfulPeriods / buckets.length) * 100 : 0
}

/**
 * Get comprehensive stats for a habit
 */
// Helper to filter out voided events inline
function filterEffectiveEventsInline(events: Event[]): Event[] {
  // First, collect all voided event IDs
  const voidedIds = new Set<string>()
  events.forEach(event => {
    if (event.meta && typeof event.meta === 'object' && 'void_of' in event.meta) {
      voidedIds.add(event.meta.void_of as string)
    }
  })

  // Filter out events that are either voided or are control events
  return events.filter(event => {
    // Exclude control events where meta.kind === 'void'
    if (event.meta && typeof event.meta === 'object' && 'kind' in event.meta && event.meta.kind === 'void') {
      return false
    }
    
    // Exclude events whose id is in voidedIds
    if (voidedIds.has(event.id)) {
      return false
    }
    
    return true
  })
}

export function getHabitStats(
  habit: Habit,
  events: Event[],
  tz: string,
  weekStart: 'MON' | 'SUN' = 'MON'
): HabitStats {
  // Ensure events is an array
  const eventsArray = Array.isArray(events) ? events : []
  const effectiveEvents = filterEffectiveEventsInline(eventsArray)
  
  const currentPeriod = getCurrentPeriod(habit.period, tz, weekStart)
  
  // Get current period events
  const currentPeriodEvents = effectiveEvents.filter(e => {
    const eventTime = new Date(e.tsClient).getTime()
    return eventTime >= currentPeriod.start.getTime() && eventTime < currentPeriod.end.getTime()
  })
  
  const currentPeriodProgress = currentPeriodEvents.reduce((sum, e) => sum + e.value, 0)
  
  const stats: HabitStats = {
    streak: 0,
    currentPeriodProgress,
    isOnPace: false,
    adherenceRate: 0
  }
  
  if (habit.type === 'build') {
    stats.streak = calculateBuildStreak(eventsArray, habit, tz, weekStart)
    stats.isOnPace = isOnPace(currentPeriodProgress, habit.target, currentPeriod.start, currentPeriod.end)
  } else {
    stats.timeSinceLastFailure = calculateTimeSinceLastFailure(eventsArray, tz)
    stats.isOnPace = currentPeriodEvents.length === 0 // No failures yet
  }
  
  stats.adherenceRate = calculateAdherenceRate(eventsArray, habit, 30, tz, weekStart)
  
  return stats
}