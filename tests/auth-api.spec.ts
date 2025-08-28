import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getHabits, POST as createHabit } from '@/app/api/habits/route'
import { GET as getEvents, POST as createEvent } from '@/app/api/habits/[id]/events/route'

// Mock the auth-server module
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test User',
  email: 'test@example.com',
  color: '#3b82f6'
}

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
  },
  event: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $disconnect: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  getPrismaClient: vi.fn(() => Promise.resolve(mockPrismaClient))
}))

describe('Auth-Protected API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/habits', () => {
    it('should return user-specific habits including household habits', async () => {
      const mockHabits = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Private Habit',
          emoji: '💧',
          type: 'build',
          target: 8,
          period: 'day',
          unit: 'count',
          unitLabel: 'glasses',
          active: true,
          visibility: 'private',
          templateKey: null,
          ownerUserId: '123e4567-e89b-12d3-a456-426614174000',
          owner: mockUser
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Household Exercise',
          emoji: '🏃',
          type: 'build',
          target: 3,
          period: 'week',
          unit: 'count',
          unitLabel: 'sessions',
          active: true,
          visibility: 'household',
          templateKey: 'exercise',
          ownerUserId: '123e4567-e89b-12d3-a456-426614174006',
          owner: {
            id: '123e4567-e89b-12d3-a456-426614174006',
            name: 'Other User',
            color: '#ef4444'
          }
        }
      ]

      mockPrismaClient.habit.findMany.mockResolvedValue(mockHabits)

      const response = await getHabits()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(mockPrismaClient.habit.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerUserId: '123e4567-e89b-12d3-a456-426614174000' },
            { visibility: 'household' }
          ]
        },
        select: {
          id: true,
          name: true,
          emoji: true,
          type: true,
          target: true,
          period: true,
          unit: true,
          unitLabel: true,
          active: true,
          visibility: true,
          templateKey: true,
          ownerUserId: true,
          owner: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          }
        }
      })
    })
  })

  describe('POST /api/habits', () => {
    it('should create habit with authenticated user as owner', async () => {
      const mockCreatedHabit = {
        id: '123e4567-e89b-12d3-a456-426614174123',
        name: 'New Habit',
        type: 'build',
        target: 5,
        period: 'week',
        unit: 'count',
        visibility: 'private',
        templateKey: null,
        ownerUserId: '123e4567-e89b-12d3-a456-426614174000',
        active: true
      }

      mockPrismaClient.habit.create.mockResolvedValue(mockCreatedHabit)

      const mockRequest = new Request('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'New Habit',
          type: 'build',
          target: 5,
          period: 'week',
          unit: 'count',
          visibility: 'private'
        })
      })

      const response = await createHabit(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('123e4567-e89b-12d3-a456-426614174123')
      expect(mockPrismaClient.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Habit',
          type: 'build',
          target: 5,
          period: 'week',
          unit: 'count',
          visibility: 'private',
          ownerUserId: '123e4567-e89b-12d3-a456-426614174000',
          active: true
        })
      })
    })

    it('should create household habit with templateKey', async () => {
      const mockCreatedHabit = {
        id: '123e4567-e89b-12d3-a456-426614174124',
        ownerUserId: '123e4567-e89b-12d3-a456-426614174000'
      }

      mockPrismaClient.habit.create.mockResolvedValue(mockCreatedHabit)

      const mockRequest = new Request('http://localhost:3000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Family Exercise',
          type: 'build',
          target: 3,
          period: 'week',
          unit: 'count',
          visibility: 'household',
          templateKey: 'exercise'
        })
      })

      const response = await createHabit(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrismaClient.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Family Exercise',
          type: 'build',
          target: 3,
          period: 'week',
          unit: 'count',
          visibility: 'household',
          templateKey: 'exercise',
          ownerUserId: '123e4567-e89b-12d3-a456-426614174000',
          active: true
        })
      })
    })
  })

  describe('GET /api/habits/[id]/events', () => {
    it('should only return events for habits owned by user', async () => {
      const habitId = '123e4567-e89b-12d3-a456-426614174003'
      const mockHabit = {
        id: habitId,
        ownerUserId: '123e4567-e89b-12d3-a456-426614174000'
      }
      const mockEvents = [
        {
          id: '123e4567-e89b-12d3-a456-426614174126',
          habitId,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          value: 1,
          note: null,
          source: 'ui',
          meta: null,
          tsClient: new Date(),
          tsServer: new Date()
        }
      ]

      mockPrismaClient.habit.findFirst.mockResolvedValue(mockHabit)
      mockPrismaClient.event.findMany.mockResolvedValue(mockEvents)

      const mockRequest = new Request(`http://localhost:3000/api/habits/${habitId}/events`, {
        method: 'GET'
      })

      const response = await getEvents(mockRequest, { params: { id: habitId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(mockPrismaClient.habit.findFirst).toHaveBeenCalledWith({
        where: {
          id: habitId,
          ownerUserId: '123e4567-e89b-12d3-a456-426614174000'
        }
      })
    })

    it('should return 404 for habits not owned by user', async () => {
      const habitId = '123e4567-e89b-12d3-a456-426614174004'
      
      mockPrismaClient.habit.findFirst.mockResolvedValue(null)

      const mockRequest = new Request(`http://localhost:3000/api/habits/${habitId}/events`, {
        method: 'GET'
      })

      const response = await getEvents(mockRequest, { params: { id: habitId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.message).toBe('Habit not found')
    })
  })

  describe('POST /api/habits/[id]/events', () => {
    it('should create event with authenticated user ID', async () => {
      const habitId = '123e4567-e89b-12d3-a456-426614174005'
      const mockHabit = {
        id: habitId,
        ownerUserId: '123e4567-e89b-12d3-a456-426614174000'
      }
      const mockEvent = {
        id: '123e4567-e89b-12d3-a456-426614174125',
        habitId,
        userId: 'user-123',
        value: 1
      }

      mockPrismaClient.habit.findFirst.mockResolvedValue(mockHabit)
      mockPrismaClient.event.create.mockResolvedValue(mockEvent)

      const mockRequest = new Request(`http://localhost:3000/api/habits/${habitId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: 1,
          note: 'Test event'
        })
      })

      const response = await createEvent(mockRequest, { params: { id: habitId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.eventId).toBe('123e4567-e89b-12d3-a456-426614174125')
      expect(mockPrismaClient.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          habitId,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          value: 1,
          note: 'Test event',
          source: 'ui'
        })
      })
    })
  })
})