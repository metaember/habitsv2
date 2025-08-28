import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET as getCalendar } from '@/app/api/calendar/route'
import { prisma } from '@/lib/db'

// Mock auth user
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com'
}

vi.mock('@/lib/auth-server', () => ({
  requireAuth: vi.fn(() => Promise.resolve(mockUser))
}))

// Mock other dependencies
vi.mock('@/lib/event-utils', () => ({
  filterEffectiveEvents: vi.fn((events) => events)
}))

vi.mock('@/lib/db', () => {
  const mockPrismaClient = {
    habit: {
      findMany: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  }
  return {
    prisma: mockPrismaClient,
    getPrismaClient: vi.fn(() => Promise.resolve(mockPrismaClient))
  }
})

describe('Household Visibility Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Calendar API with Household Habits', () => {
    it('should include both user habits and household habits', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Private Reading',
          type: 'build',
          target: 30,
          period: 'day',
          unit: 'minutes',
          active: true,
          visibility: 'private',
          ownerUserId: 'user-123',
          owner: {
            id: 'user-123',
            name: 'Test User',
            color: '#3b82f6'
          }
        },
        {
          id: 'habit-2',
          name: 'Family Exercise',
          type: 'build',
          target: 3,
          period: 'week',
          unit: 'count',
          active: true,
          visibility: 'household',
          ownerUserId: 'user-456',
          owner: {
            id: 'user-456',
            name: 'Other User',
            color: '#ef4444'
          }
        }
      ]

      const mockEvents = [
        {
          id: 'event-1',
          habitId: 'habit-1',
          userId: 'user-123',
          value: 30,
          tsClient: new Date('2024-01-15T09:00:00Z'),
          habit: mockHabits[0],
          user: {
            id: 'user-123',
            name: 'Test User',
            color: '#3b82f6'
          }
        },
        {
          id: 'event-2',
          habitId: 'habit-2',
          userId: 'user-456',
          value: 1,
          tsClient: new Date('2024-01-15T19:00:00Z'),
          habit: mockHabits[1],
          user: {
            id: 'user-456',
            name: 'Other User',
            color: '#ef4444'
          }
        }
      ]

      ;(prisma.habit.findMany as any).mockResolvedValue(mockHabits)
      ;(prisma.event.findMany as any).mockResolvedValue(mockEvents)

      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn((param) => {
              if (param === 'month') return '2024-01'
              return null
            })
          }
        }
      } as any

      const response = await getCalendar(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.days).toBeDefined()

      // Verify the query includes both user's habits and household habits
      expect(prisma.habit.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          OR: [
            { ownerUserId: 'user-123' },
            { visibility: 'household' }
          ]
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          }
        }
      })

      // Verify events query includes user information
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            habit: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                color: true,
              }
            }
          }
        })
      )
    })

    it('should handle month parameter validation', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn(() => null) // No month parameter
          }
        }
      } as any

      const response = await getCalendar(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('month parameter required (YYYY-MM)')
    })

    it('should handle invalid month format', async () => {
      const mockRequest = {
        nextUrl: {
          searchParams: {
            get: vi.fn((param) => {
              if (param === 'month') return 'invalid-format'
              return null
            })
          }
        }
      } as any

      const response = await getCalendar(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('month must be in YYYY-MM format')
    })
  })

  describe('Habit Visibility Logic', () => {
    it('should correctly determine household vs private habits', () => {
      const habits = [
        { id: '1', visibility: 'private', ownerUserId: 'user-123' },
        { id: '2', visibility: 'household', ownerUserId: 'user-456' },
        { id: '3', visibility: 'private', ownerUserId: 'user-789' }
      ]

      // Simulate the filtering logic from the API
      const userHabits = habits.filter(h => 
        h.ownerUserId === 'user-123' || h.visibility === 'household'
      )

      expect(userHabits).toHaveLength(2)
      expect(userHabits.map(h => h.id)).toEqual(['1', '2'])
    })

    it('should handle templateKey grouping for household habits', () => {
      const habits = [
        { 
          id: '1', 
          templateKey: 'exercise', 
          visibility: 'household',
          name: 'Running',
          ownerUserId: 'user-123'
        },
        { 
          id: '2', 
          templateKey: 'exercise', 
          visibility: 'household',
          name: 'Gym',
          ownerUserId: 'user-456'
        },
        { 
          id: '3', 
          templateKey: null, 
          visibility: 'private',
          name: 'Reading',
          ownerUserId: 'user-123'
        }
      ]

      // Group by templateKey for household habits
      const mergedGroups: { [key: string]: typeof habits } = {}
      const individualHabits: typeof habits = []

      habits.forEach(habit => {
        if (habit.templateKey && habit.visibility === 'household') {
          if (!mergedGroups[habit.templateKey]) {
            mergedGroups[habit.templateKey] = []
          }
          mergedGroups[habit.templateKey].push(habit)
        } else {
          individualHabits.push(habit)
        }
      })

      expect(Object.keys(mergedGroups)).toEqual(['exercise'])
      expect(mergedGroups.exercise).toHaveLength(2)
      expect(individualHabits).toHaveLength(1)
      expect(individualHabits[0].name).toBe('Reading')
    })
  })
})