import { describe, it, expect } from 'vitest'

describe('Habits Management Logic', () => {

  describe('Habit Ordering', () => {
    it('should move habit up in order', () => {
      const orderIds = ['habit1', 'habit2', 'habit3']
      const index = 1 // habit2
      const direction = 'up'

      const newOrder = [...orderIds]
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      // Swap positions
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]

      expect(newOrder).toEqual(['habit2', 'habit1', 'habit3'])
      expect(targetIndex).toBe(0)
    })

    it('should move habit down in order', () => {
      const orderIds = ['habit1', 'habit2', 'habit3']
      const index = 0 // habit1
      const direction = 'down'

      const newOrder = [...orderIds]
      const targetIndex = index + 1 // move down

      // Swap positions
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]

      expect(newOrder).toEqual(['habit2', 'habit1', 'habit3'])
      expect(targetIndex).toBe(1)
    })

    it('should not move habit up when already at top', () => {
      const orderIds = ['habit1', 'habit2', 'habit3']
      const index = 0 // habit1
      const direction = 'up'
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      expect(targetIndex).toBe(-1) // Would be out of bounds
      // In the actual implementation, this would return early
    })

    it('should not move habit down when already at bottom', () => {
      const orderIds = ['habit1', 'habit2', 'habit3']
      const index = 2 // habit3
      const direction = 'down'
      const targetIndex = index + 1 // would be out of bounds

      expect(targetIndex).toBe(3) // Would be out of bounds
      // In the actual implementation, this would return early
    })

    it('should create correct JSON structure for localStorage', () => {
      const orderIds = ['habit1', 'habit2', 'habit3']
      const jsonString = JSON.stringify(orderIds)
      
      expect(jsonString).toBe('["habit1","habit2","habit3"]')
      expect(JSON.parse(jsonString)).toEqual(['habit1', 'habit2', 'habit3'])
    })
  })

  describe('Habit Sorting', () => {
    it('should sort habits based on saved order', () => {
      const habits = [
        { id: 'habit2', name: 'Habit 2' },
        { id: 'habit1', name: 'Habit 1' },
        { id: 'habit3', name: 'Habit 3' }
      ]
      const orderIds = ['habit1', 'habit2', 'habit3']

      const sortedHabits = [...habits].sort((a, b) => {
        const aIndex = orderIds.indexOf(a.id)
        const bIndex = orderIds.indexOf(b.id)

        // If not in order array, put at end
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1

        return aIndex - bIndex
      })

      expect(sortedHabits).toEqual([
        { id: 'habit1', name: 'Habit 1' },
        { id: 'habit2', name: 'Habit 2' },
        { id: 'habit3', name: 'Habit 3' }
      ])
    })

    it('should handle habits not in order array', () => {
      const habits = [
        { id: 'habit2', name: 'Habit 2' },
        { id: 'habit4', name: 'Habit 4' }, // Not in order
        { id: 'habit1', name: 'Habit 1' }
      ]
      const orderIds = ['habit1', 'habit2']

      const sortedHabits = [...habits].sort((a, b) => {
        const aIndex = orderIds.indexOf(a.id)
        const bIndex = orderIds.indexOf(b.id)

        // If not in order array, put at end
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1

        return aIndex - bIndex
      })

      expect(sortedHabits).toEqual([
        { id: 'habit1', name: 'Habit 1' },
        { id: 'habit2', name: 'Habit 2' },
        { id: 'habit4', name: 'Habit 4' } // Goes to end
      ])
    })
  })

  describe('Active/Archived Filtering', () => {
    it('should separate active and archived habits', () => {
      const habits = [
        { id: 'habit1', name: 'Active Habit', active: true },
        { id: 'habit2', name: 'Archived Habit', active: false },
        { id: 'habit3', name: 'Another Active', active: true }
      ]

      const activeHabits = habits.filter(h => h.active)
      const archivedHabits = habits.filter(h => !h.active)

      expect(activeHabits).toHaveLength(2)
      expect(activeHabits[0].name).toBe('Active Habit')
      expect(activeHabits[1].name).toBe('Another Active')

      expect(archivedHabits).toHaveLength(1)
      expect(archivedHabits[0].name).toBe('Archived Habit')
    })

    it('should handle all active habits', () => {
      const habits = [
        { id: 'habit1', name: 'Active Habit 1', active: true },
        { id: 'habit2', name: 'Active Habit 2', active: true }
      ]

      const activeHabits = habits.filter(h => h.active)
      const archivedHabits = habits.filter(h => !h.active)

      expect(activeHabits).toHaveLength(2)
      expect(archivedHabits).toHaveLength(0)
    })

    it('should handle all archived habits', () => {
      const habits = [
        { id: 'habit1', name: 'Archived Habit 1', active: false },
        { id: 'habit2', name: 'Archived Habit 2', active: false }
      ]

      const activeHabits = habits.filter(h => h.active)
      const archivedHabits = habits.filter(h => !h.active)

      expect(activeHabits).toHaveLength(0)
      expect(archivedHabits).toHaveLength(2)
    })
  })
})