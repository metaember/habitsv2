import { prisma } from '@/lib/db'

/**
 * Export helper functions.
 * These functions handle exporting data in NDJSON format.
 */

export async function exportToNDJSON() {
  try {
    // Fetch all habits
    const habits = await prisma.habit.findMany()
    
    // Fetch all events
    const events = await prisma.event.findMany()
    
    // Create NDJSON string
    let ndjson = ''
    
    // Add habits to NDJSON
    for (const habit of habits) {
      ndjson += JSON.stringify({ kind: 'habit', ...habit }) + '\n'
    }
    
    // Add events to NDJSON
    for (const event of events) {
      ndjson += JSON.stringify({ kind: 'event', ...event }) + '\n'
    }
    
    return ndjson
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}