import { describe, it, expect, vi } from 'vitest'
import { GET as healthCheck } from '@/app/api/health/route'
import { GET as getHabits, POST as createHabit } from '@/app/api/habits/route'
import { GET as getEvents, POST as createEvent } from '@/app/api/habits/[id]/events/route'
import { POST as voidEvent } from '@/app/api/events/[id]/void/route'
import { GET as exportData } from '@/app/api/export.jsonl/route'

// Mock auth user
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
}

// Mock auth-server
vi.mock('@/lib/auth-server', () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockUser)),
  getAuthenticatedUser: vi.fn(() => Promise.resolve(mockUser))
}))

// Mock Prisma client
const mockPrismaClient = {
  habit: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => Promise.resolve(mockPrismaClient))
}))

describe('API', () => {
  it('should handle health check correctly', async () => {
    const response = await healthCheck()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
  })

  it('should handle habit creation correctly', async () => {
    const mockHabit = { 
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Habit',
      type: 'build',
      target: 1,
      period: 'day',
      unit: 'count',
      unitLabel: null,
      emoji: null,
      active: true,
      ownerUserId: 'user-123',
      visibility: 'private',
      templateKey: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    mockPrismaClient.habit.create.mockResolvedValue(mockHabit)
    
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
    expect(data.id).toBe('123e4567-e89b-12d3-a456-426614174000')
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
    const mockEvent = { 
      id: '123e4567-e89b-12d3-a456-426614174001',
      habitId: '123e4567-e89b-12d3-a456-426614174000',
      value: 1,
      note: null,
      tsClient: new Date(),
      tsServer: new Date(),
      meta: {}
    }
    mockPrismaClient.habit.findFirst.mockResolvedValue({ 
      id: '123e4567-e89b-12d3-a456-426614174000', 
      name: 'Test', 
      type: 'build', 
      target: 1, 
      period: 'day', 
      unit: 'count', 
      unitLabel: null, 
      emoji: null, 
      active: true, 
      ownerUserId: 'user-123',
      createdAt: new Date(), 
      updatedAt: new Date() 
    })
    mockPrismaClient.event.create.mockResolvedValue(mockEvent)
    
    const request = new Request('http://localhost:3000/api/habits/1/events', {
      method: 'POST',
      body: JSON.stringify({
        value: 1
      })
    })
    
    const response = await createEvent(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.eventId).toBe('123e4567-e89b-12d3-a456-426614174001')
  })

  it('should handle event creation with validation errors', async () => {
    mockPrismaClient.habit.findFirst.mockResolvedValue({ 
      id: '123e4567-e89b-12d3-a456-426614174000', 
      name: 'Test', 
      type: 'build', 
      target: 1, 
      period: 'day', 
      unit: 'count', 
      unitLabel: null, 
      emoji: null, 
      active: true, 
      ownerUserId: 'user-123',
      createdAt: new Date(), 
      updatedAt: new Date() 
    })
    
    const request = new Request('http://localhost:3000/api/habits/1/events', {
      method: 'POST',
      body: JSON.stringify({
        value: -1 // Invalid value
      })
    })
    
    const response = await createEvent(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should handle event creation for non-existent habit', async () => {
    mockPrismaClient.habit.findFirst.mockResolvedValue(null) // Habit not found
    
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
    mockPrismaClient.event.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174001', habitId: '123e4567-e89b-12d3-a456-426614174000', value: 1, note: null, tsClient: new Date(), tsServer: new Date(), meta: {} })
    mockPrismaClient.event.findFirst.mockResolvedValue(null)
    mockPrismaClient.event.create.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', habitId: '123e4567-e89b-12d3-a456-426614174000', value: 0, note: null, tsClient: new Date(), tsServer: new Date(), meta: { kind: 'void', void_of: '123e4567-e89b-12d3-a456-426614174001', reason: 'mistap' } })
    
    const request = new Request('http://localhost:3000/api/events/123e4567-e89b-12d3-a456-426614174001/void', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'mistap'
      })
    })
    
    const response = await voidEvent(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.voidEventId).toBe('123e4567-e89b-12d3-a456-426614174002')
  })

  it('should handle event voiding for non-existent event', async () => {
    mockPrismaClient.event.findUnique.mockResolvedValue(null) // Event not found
    
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
    mockPrismaClient.event.findUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', habitId: '123e4567-e89b-12d3-a456-426614174000', value: 1, note: null, tsClient: new Date(), tsServer: new Date(), meta: {} })
    mockPrismaClient.event.findFirst.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', habitId: '123e4567-e89b-12d3-a456-426614174000', value: 0, note: null, tsClient: new Date(), tsServer: new Date(), meta: { kind: 'void', void_of: '123e4567-e89b-12d3-a456-426614174001', reason: 'mistap' } }) // Already voided
    
    const request = new Request('http://localhost:3000/api/events/123e4567-e89b-12d3-a456-426614174001/void', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'mistap'
      })
    })
    
    const response = await voidEvent(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
    const data = await response.json()
    
    expect(response.status).toBe(409)
    expect(data.error).toBeDefined()
  })

  it('should handle export correctly', async () => {
    mockPrismaClient.habit.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Habit', type: 'build', target: 1, period: 'day', unit: 'count', unitLabel: null, emoji: null, active: true, createdAt: new Date(), updatedAt: new Date() }])
    mockPrismaClient.event.findMany.mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174000', habitId: '123e4567-e89b-12d3-a456-426614174000', value: 1, note: null, tsClient: new Date(), tsServer: new Date(), meta: {} }])
    
    const response: any = await exportData()
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson')
  })

  it('should handle habit listing correctly', async () => {
    const mockHabits = [
      { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Habit 1', type: 'build', target: 1, period: 'day', unit: 'count', unitLabel: null, emoji: null, active: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '223e4567-e89b-12d3-a456-426614174000', name: 'Test Habit 2', type: 'break', target: 0, period: 'day', unit: 'count', unitLabel: null, emoji: null, active: true, createdAt: new Date(), updatedAt: new Date() }
    ]
    mockPrismaClient.habit.findMany.mockResolvedValue(mockHabits)
    
    const response = await getHabits()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].id).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(data[1].id).toBe('223e4567-e89b-12d3-a456-426614174000')
  })
})