import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import MergedHabitCard from '@/components/MergedHabitCard'

// Mock the stats and period libraries
vi.mock('@/lib/stats', () => ({
  getHabitStats: vi.fn(() => ({
    currentPeriodProgress: 2,
    streak: 5,
    adherence: 0.8
  }))
}))

vi.mock('@/lib/period', () => ({
  getCurrentPeriod: vi.fn(() => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-01-07')
  }))
}))

// Mock fetch for events
global.fetch = vi.fn()

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockHabitsWithOwners = [
  {
    id: 'habit-1',
    name: 'Exercise',
    emoji: '🏃',
    type: 'build' as const,
    target: 3,
    period: 'week' as const,
    unit: 'count' as const,
    unitLabel: 'sessions',
    active: true,
    visibility: 'household' as const,
    templateKey: 'exercise',
    ownerUserId: 'user-1',
    owner: {
      id: 'user-1',
      name: 'Alice',
      color: '#3b82f6'
    }
  },
  {
    id: 'habit-2', 
    name: 'Exercise',
    emoji: '🏃',
    type: 'build' as const,
    target: 4,
    period: 'week' as const,
    unit: 'count' as const,
    unitLabel: 'sessions',
    active: true,
    visibility: 'household' as const,
    templateKey: 'exercise',
    ownerUserId: 'user-2',
    owner: {
      id: 'user-2',
      name: 'Bob',
      color: '#ef4444'
    }
  }
]

describe('Merged Habits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch to return events
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve([
        {
          id: 'event-1',
          habitId: 'habit-1',
          value: 1,
          tsClient: new Date().toISOString()
        }
      ])
    })
  })

  describe('MergedHabitCard', () => {
    it('should display merged habit with multiple users', async () => {
      render(
        <MergedHabitCard
          templateKey="exercise"
          habits={mockHabitsWithOwners}
          emoji="🏃"
          name="Exercise"
        />
      )

      // Check that the main habit info is displayed
      expect(screen.getByText('Exercise')).toBeInTheDocument()
      expect(screen.getByText('🏃')).toBeInTheDocument()
      expect(screen.getByText('Household')).toBeInTheDocument()

      // Wait for user names to appear
      await screen.findByText('Alice')
      await screen.findByText('Bob')

      // Check that both users are displayed
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()

      // Check member count
      expect(screen.getByText('2 members')).toBeInTheDocument()
    })

    it('should show individual progress for each user', async () => {
      render(
        <MergedHabitCard
          templateKey="exercise"
          habits={mockHabitsWithOwners}
          emoji="🏃"
          name="Exercise"
        />
      )

      // Wait for progress to load
      await screen.findByText('Alice')

      // Check that progress is shown for each user
      expect(screen.getByText('2/3')).toBeInTheDocument() // Alice's progress
      expect(screen.getByText('2/4')).toBeInTheDocument() // Bob's progress
    })

    it('should display user avatars with correct colors', async () => {
      const { container } = render(
        <MergedHabitCard
          templateKey="exercise"
          habits={mockHabitsWithOwners}
          emoji="🏃"
          name="Exercise"
        />
      )

      await screen.findByText('Alice')

      // Check that user avatars are rendered
      const avatars = container.querySelectorAll('[style*="background-color"]')
      expect(avatars.length).toBeGreaterThan(0)
      
      // Check that initials are displayed
      expect(screen.getByText('A')).toBeInTheDocument() // Alice
      expect(screen.getByText('B')).toBeInTheDocument() // Bob
    })

    it('should handle loading state', () => {
      // Mock fetch to never resolve to test loading state
      ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))

      render(
        <MergedHabitCard
          templateKey="exercise"
          habits={mockHabitsWithOwners}
          emoji="🏃"
          name="Exercise"
        />
      )

      // Check loading state - look for loading skeleton or "... total"
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument() // Loading indicator in stats
    })
  })

  describe('Template Key Grouping', () => {
    it('should group habits by templateKey correctly', () => {
      const habits = [
        { ...mockHabitsWithOwners[0], templateKey: 'exercise' },
        { ...mockHabitsWithOwners[1], templateKey: 'exercise' },
        { ...mockHabitsWithOwners[0], id: 'habit-3', templateKey: 'reading', name: 'Reading' }
      ]

      // Test grouping logic (this would be in the Today page component)
      const grouped = habits.reduce((acc, habit) => {
        if (habit.templateKey && habit.visibility === 'household') {
          if (!acc[habit.templateKey]) {
            acc[habit.templateKey] = []
          }
          acc[habit.templateKey].push(habit)
        }
        return acc
      }, {} as { [key: string]: typeof habits })

      expect(grouped.exercise).toHaveLength(2)
      expect(grouped.reading).toHaveLength(1)
    })

    it('should handle habits without templateKey', () => {
      const habits = [
        { ...mockHabitsWithOwners[0], templateKey: null },
        { ...mockHabitsWithOwners[1], templateKey: 'exercise' }
      ]

      const grouped = habits.reduce((acc, habit) => {
        if (habit.templateKey && habit.visibility === 'household') {
          if (!acc[habit.templateKey]) {
            acc[habit.templateKey] = []
          }
          acc[habit.templateKey].push(habit)
        }
        return acc
      }, {} as { [key: string]: typeof habits })

      expect(grouped.exercise).toHaveLength(1)
      expect(Object.keys(grouped)).toHaveLength(1)
    })
  })
})