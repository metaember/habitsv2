import { prisma } from '../lib/db'

async function testDb() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful:', result)
    
    // Try to count habits
    const habitCount = await prisma.habit.count()
    console.log('Number of habits:', habitCount)
    
    // If no habits, create a test one
    if (habitCount === 0) {
      console.log('Creating test habit...')
      const habit = await prisma.habit.create({
        data: {
          name: 'Drink Water',
          emoji: '💧',
          type: 'build',
          target: 8,
          period: 'day',
          unit: 'count',
          active: true,
        }
      })
      console.log('Created habit:', habit)
    }
    
    // List all habits
    const habits = await prisma.habit.findMany()
    console.log('All habits:', habits)
    
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDb()