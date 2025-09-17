/**
 * Date utility functions for habit tracking
 */

export function formatDateDisplay(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Reset time for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  }
  
  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  }
  
  // For dates within the last week, show day name and date
  const daysDiff = Math.floor((todayOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff <= 7 && daysDiff > 0) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  // For older dates, include year if different
  if (date.getFullYear() !== today.getFullYear()) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

export function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days: Date[] = []
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  return days
}

export function getCalendarDays(date: Date): (Date | null)[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = firstDay.getDay()
  
  const days: (Date | null)[] = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  
  // Fill remaining cells to make complete weeks
  while (days.length % 7 !== 0) {
    days.push(null)
  }
  
  return days
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isFutureDate(date: Date): boolean {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date > today
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISOToDate(isoString: string): Date {
  return new Date(isoString)
}

export function setTimeToNoon(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(12, 0, 0, 0)
  return newDate
}