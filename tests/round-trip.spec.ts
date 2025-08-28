import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db'
import { GET as exportData } from '@/app/api/export.jsonl/route'
import { POST as importData } from '@/app/api/import.jsonl/route'

// Helper function to create a proper NextRequest mock for testing
function createNextRequest(url: string, body: string): any {
  const request = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: body
  })

  return {
    ...request,
    nextUrl: new URL(url),
    text: async () => body,
    json: request.json.bind(request)
  }
}

describe('Round-trip Import/Export', () => {
  // Clean up database before and after each test
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.habit.deleteMany()
  })

  afterEach(async () => {
    await prisma.event.deleteMany()
    await prisma.habit.deleteMany()
  })

  it('should preserve data integrity through export->import cycle', async () => {
    // Step 1: Create test data
    const testHabit1 = await prisma.habit.create({
      data: {
        name: 'Test Build Habit',
        emoji: '🏃',
        type: 'build',
        target: 5,
        period: 'week',
        unit: 'count',
        unitLabel: null,
        active: true,
      }
    })

    const testHabit2 = await prisma.habit.create({
      data: {
        name: 'Test Break Habit',
        emoji: '🚭',
        type: 'break',
        target: 0,
        period: 'day',
        unit: 'minutes',
        unitLabel: 'cigs',
        active: true,
        scheduleDowMask: 127, // All days
      }
    })

    const testEvent1 = await prisma.event.create({
      data: {
        habitId: testHabit1.id,
        value: 2,
        note: 'Morning workout',
        tsClient: new Date('2025-01-01T08:00:00Z'),
        source: 'ui',
        clientId: 'test-client-1',
      }
    })

    const testEvent2 = await prisma.event.create({
      data: {
        habitId: testHabit2.id,
        value: 1,
        note: 'Stress incident',
        tsClient: new Date('2025-01-01T14:30:00Z'),
        source: 'ui',
        clientId: 'test-client-2',
      }
    })

    // Step 2: Export data
    const exportResponse = await exportData()
    expect(exportResponse.status).toBe(200)

    const exportedText = await exportResponse.text()
    const exportedLines = exportedText.trim().split('\n')
    
    // Verify export format
    expect(exportedLines).toHaveLength(4) // 2 habits + 2 events
    
    const habits = exportedLines.slice(0, 2).map(line => JSON.parse(line))
    const events = exportedLines.slice(2, 4).map(line => JSON.parse(line))

    // Verify exported habits
    expect(habits[0]).toMatchObject({
      kind: 'habit',
      id: testHabit1.id,
      name: 'Test Build Habit',
      emoji: '🏃',
      type: 'build',
      target: 5,
      period: 'week',
      unit: 'count',
      active: true,
    })

    expect(habits[1]).toMatchObject({
      kind: 'habit',
      id: testHabit2.id,
      name: 'Test Break Habit',
      emoji: '🚭',
      type: 'break',
      target: 0,
      period: 'day',
      unit: 'minutes',
      unitLabel: 'cigs',
      active: true,
      scheduleDowMask: 127,
    })

    // Verify exported events
    expect(events[0]).toMatchObject({
      kind: 'event',
      id: testEvent1.id,
      habitId: testHabit1.id,
      value: 2,
      note: 'Morning workout',
      source: 'ui',
      clientId: 'test-client-1',
    })

    expect(events[1]).toMatchObject({
      kind: 'event',
      id: testEvent2.id,
      habitId: testHabit2.id,
      value: 1,
      note: 'Stress incident',
      source: 'ui',
      clientId: 'test-client-2',
    })

    // Step 3: Clear database
    await prisma.event.deleteMany()
    await prisma.habit.deleteMany()

    // Verify database is empty
    const habitsAfterDelete = await prisma.habit.findMany()
    const eventsAfterDelete = await prisma.event.findMany()
    expect(habitsAfterDelete).toHaveLength(0)
    expect(eventsAfterDelete).toHaveLength(0)

    // Step 4: Import data back
    const nextRequest = createNextRequest('http://localhost:3000/api/import.jsonl', exportedText)
    const importResponse = await importData(nextRequest)
    expect(importResponse.status).toBe(200)

    const importResult = await importResponse.json()
    expect(importResult.success).toBe(true)
    expect(importResult.result.totalLines).toBe(4)
    expect(importResult.result.processed).toBe(4)
    expect(importResult.result.created).toBe(4)
    expect(importResult.result.skipped).toBe(0)
    expect(importResult.result.errors).toHaveLength(0)

    // Step 5: Verify data integrity after import
    const importedHabits = await prisma.habit.findMany({
      orderBy: { name: 'asc' }
    })
    const importedEvents = await prisma.event.findMany({
      orderBy: { tsClient: 'asc' }
    })

    expect(importedHabits).toHaveLength(2)
    expect(importedEvents).toHaveLength(2)

    // Verify habit 1 (build habit)
    const buildHabit = importedHabits.find(h => h.type === 'build')
    expect(buildHabit).toMatchObject({
      id: testHabit1.id,
      name: 'Test Build Habit',
      emoji: '🏃',
      type: 'build',
      target: 5,
      period: 'week',
      unit: 'count',
      unitLabel: null,
      active: true,
      scheduleDowMask: null,
    })

    // Verify habit 2 (break habit)
    const breakHabit = importedHabits.find(h => h.type === 'break')
    expect(breakHabit).toMatchObject({
      id: testHabit2.id,
      name: 'Test Break Habit',
      emoji: '🚭',
      type: 'break',
      target: 0,
      period: 'day',
      unit: 'minutes',
      unitLabel: 'cigs',
      active: true,
      scheduleDowMask: 127,
    })

    // Verify event 1 (build habit event)
    const buildEvent = importedEvents.find(e => e.habitId === testHabit1.id)
    expect(buildEvent).toMatchObject({
      id: testEvent1.id,
      habitId: testHabit1.id,
      value: 2,
      note: 'Morning workout',
      source: 'ui',
      clientId: 'test-client-1',
    })
    expect(buildEvent?.tsClient.getTime()).toBe(new Date('2025-01-01T08:00:00Z').getTime())

    // Verify event 2 (break habit event)
    const breakEvent = importedEvents.find(e => e.habitId === testHabit2.id)
    expect(breakEvent).toMatchObject({
      id: testEvent2.id,
      habitId: testHabit2.id,
      value: 1,
      note: 'Stress incident',
      source: 'ui',
      clientId: 'test-client-2',
    })
    expect(breakEvent?.tsClient.getTime()).toBe(new Date('2025-01-01T14:30:00Z').getTime())
  })

  it('should handle deduplication correctly on re-import', async () => {
    // Step 1: Create and export test data
    const testHabit = await prisma.habit.create({
      data: {
        name: 'Dedupe Test Habit',
        type: 'build',
        target: 1,
        period: 'day',
        unit: 'count',
      }
    })

    const testEvent = await prisma.event.create({
      data: {
        habitId: testHabit.id,
        value: 1,
        tsClient: new Date('2025-01-01T12:00:00Z'),
        clientId: 'dedupe-test',
      }
    })

    const exportResponse = await exportData()
    const exportedText = await exportResponse.text()

    // Step 2: Try to import the same data again (should deduplicate)
    const nextRequest = createNextRequest('http://localhost:3000/api/import.jsonl', exportedText)
    const importResponse = await importData(nextRequest)
    const importResult = await importResponse.json()

    expect(importResponse.status).toBe(200)
    expect(importResult.success).toBe(true)
    expect(importResult.result.processed).toBe(2)
    expect(importResult.result.created).toBe(0) // Nothing new created
    expect(importResult.result.skipped).toBe(2) // Both items skipped as duplicates
    expect(importResult.result.errors).toHaveLength(0)

    // Verify no duplicates created
    const habits = await prisma.habit.findMany()
    const events = await prisma.event.findMany()
    expect(habits).toHaveLength(1)
    expect(events).toHaveLength(1)
  })

  it('should handle dry run import correctly', async () => {
    // Step 1: Create and export test data
    const testHabit = await prisma.habit.create({
      data: {
        name: 'Dry Run Test',
        type: 'build',
        target: 3,
        period: 'week',
        unit: 'minutes',
        unitLabel: 'hrs',
      }
    })

    const exportResponse = await exportData()
    const exportedText = await exportResponse.text()

    // Step 2: Clear database
    await prisma.event.deleteMany()
    await prisma.habit.deleteMany()

    // Step 3: Try dry run import
    const nextRequest = createNextRequest('http://localhost:3000/api/import.jsonl?dryRun=1', exportedText)
    const dryRunResponse = await importData(nextRequest)
    const dryRunResult = await dryRunResponse.json()

    expect(dryRunResponse.status).toBe(200)
    expect(dryRunResult.dryRun).toBe(true)
    expect(dryRunResult.result.processed).toBe(1) // Only 1 habit line, no events
    expect(dryRunResult.result.errors).toHaveLength(0)

    // Verify database is still empty (dry run doesn't modify data)
    const habits = await prisma.habit.findMany()
    const events = await prisma.event.findMany()
    expect(habits).toHaveLength(0)
    expect(events).toHaveLength(0)
  })

  it('should handle malformed import data with proper error reporting', async () => {
    const malformedData = `{"kind":"habit","id":"invalid-uuid","name":"Test"}
{"kind":"event","habitId":"missing-habit","value":-1}
invalid json line
{"kind":"unknown","data":"test"}`

    const nextRequest = createNextRequest('http://localhost:3000/api/import.jsonl', malformedData)
    const importResponse = await importData(nextRequest)
    const importResult = await importResponse.json()

    expect(importResponse.status).toBe(200)
    expect(importResult.success).toBe(true)
    expect(importResult.result.totalLines).toBe(4)
    expect(importResult.result.processed).toBe(0) // No valid items
    expect(importResult.result.created).toBe(0)
    expect(importResult.result.errors).toHaveLength(4) // All lines have errors

    // Check error details
    const errors = importResult.result.errors
    expect(errors[0].line).toBe(1)
    expect(errors[0].error).toContain('Invalid uuid')
    expect(errors[1].line).toBe(2)
    expect(errors[2].line).toBe(3)
    expect(errors[2].error).toContain('is not valid JSON')
    expect(errors[3].line).toBe(4)
    expect(errors[3].error).toContain('Unknown kind')
  })
})