import { describe, it, expect, vi } from 'vitest'
import { GET as healthCheck } from '@/app/api/health/route'
import { GET as getHabits, POST as createHabit } from '@/app/api/habits/route'
import { GET as getEvents, POST as createEvent } from '@/app/api/habits/[id]/events/route'
import { POST as voidEvent } from '@/app/api/events/[id]/void/route'
import { GET as exportData } from '@/app/api/export.jsonl/route'

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    habit: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}))

describe('API', () => {
  it('should handle health check correctly', async () => {
    const response = await healthCheck()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
  })

  it('should handle habit creation correctly', async () => {
    const mockHabit = { id: '1' }
    const { prisma } = await import('@/lib/db')
    prisma.habit.create = vi.fn().mockResolvedValue(mockHabit)
    
    const request = new Request('http://localhost:3000/api/habits', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Habit',
        type: 'build',
        target: 1,
        period: 'day'
      })
    })
    
    const response = await createHabit(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.id).toBe('1')
  })

  it('should handle habit creation with validation errors', async () => {
    const request = new Request('http://localhost:3000/api/habits', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid name
        type: 'build',
        target: 1,
        period: 'day'
      })
    })
    
    const response = await createHabit(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should handle event creation correctly', async () => {
    const mockEvent = { id: '1' }
    const { prisma } = await import('@/lib/db')
    prisma.habit.findUnique = vi.fn().mockResolvedValue({ id: '1' })
    prisma.event.create = vi.fn().mockResolvedValue(mockEvent)
    
    const request = new Request('http://localhost:3000/api/habits/1/events', {
      method: 'POST',
      body: JSON.stringify({
        value: 1
      })
    })
    
    const response = await createEvent(request, { params: { id: '1' } })
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.eventId).toBe('1')
  })

  it('should handle event creation with validation errors', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.habit.findUnique = vi.fn().mockResolvedValue({ id: '1' })
    
    const request = new Request('http://localhost:3000/api/habits/1/events', {
      method: 'POST',
      body: JSON.stringify({
        value: -1 // Invalid value
      })
    })
    
    const response = await createEvent(request, { params: { id: '1' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should handle event creation for non-existent habit', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.habit.findUnique = vi.fn().mockResolvedValue(null) // Habit not found
    
    const request = new Request('http://localhost:3000/api/habits/999/events', {
      method: 'POST',
      body: JSON.stringify({
        value: 1
      })
    })
    
    const response = await createEvent(request, { params: { id: '999' } })
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBeDefined()
  })

  it('should handle event voiding correctly', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.event.findUnique = vi.fn().mockResolvedValue({ id: '1', habitId: '1' })
    prisma.event.findFirst = vi.fn().mockResolvedValue(null)
    prisma.event.create = vi.fn().mockResolvedValue({ id: '2' })
    
    const request = new Request('http://localhost:3000/api/events/1/void', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'mistap'
      })
    })
    
    const response = await voidEvent(request, { params: { id: '1' } })
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.voidEventId).toBe('2')
  })

  it('should handle event voiding for non-existent event', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.event.findUnique = vi.fn().mockResolvedValue(null) // Event not found
    
    const request = new Request('http://localhost:3000/api/events/999/void', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'mistap'
      })
    })
    
    const response = await voidEvent(request, { params: { id: '999' } })
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBeDefined()
  })

  it('should handle event voiding for already voided event', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.event.findUnique = vi.fn().mockResolvedValue({ id: '1', habitId: '1' })
    prisma.event.findFirst = vi.fn().mockResolvedValue({ id: '2' }) // Already voided
    
    const request = new Request('http://localhost:3000/api/events/1/void', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'mistap'
      })
    })
    
    const response = await voidEvent(request, { params: { id: '1' } })
    const data = await response.json()
    
    expect(response.status).toBe(409)
    expect(data.error).toBeDefined()
  })

  it('should handle export correctly', async () => {
    const { prisma } = await import('@/lib/db')
    prisma.habit.findMany = vi.fn().mockResolvedValue([{ id: '1', name: 'Test Habit' }])
    prisma.event.findMany = vi.fn().mockResolvedValue([{ id: '1', habitId: '1', value: 1 }])
    
    const response: any = await exportData()
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')
  })

  it('should handle habit listing correctly', async () => {
    const mockHabits = [
      { id: '1', name: 'Test Habit 1', type: 'build', target: 1, period: 'day', unit: 'count', unitLabel: null, active: true },
      { id: '2', name: 'Test Habit 2', type: 'break', target: 0, period: 'day', unit: 'count', unitLabel: null, active: true }
    ]
    const { prisma } = await import('@/lib/db')
    prisma.habit.findMany = vi.fn().mockResolvedValue(mockHabits)
    
    const response = await getHabits()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].id).toBe('1')
    expect(data[1].id).toBe('2')
  })
}))