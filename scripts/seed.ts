import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a demo user
  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      timezone: 'America/New_York',
      kioskMode: false,
    },
  })

  // Create a demo build habit
  const buildHabit = await prisma.habit.create({
    data: {
      name: 'Drink Water',
      emoji: '💧',
      type: 'build',
      target: 8,
      period: 'day',
      unit: 'count',
      unitLabel: 'glasses',
      ownerUserId: user.id,
      active: true,
    },
  })

  // Create a demo break habit
  const breakHabit = await prisma.habit.create({
    data: {
      name: 'No Smoking',
      emoji: '🚭',
      type: 'break',
      target: 0, // For break habits, target is typically 0 (no incidents allowed)
      period: 'day',
      ownerUserId: user.id,
      active: true,
    },
  })

  // Create some events for the build habit
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.event.createMany({
    data: [
      {
        habitId: buildHabit.id,
        userId: user.id,
        tsClient: today.toISOString(),
        value: 1,
        note: 'Morning glass',
        source: 'ui',
      },
      {
        habitId: buildHabit.id,
        userId: user.id,
        tsClient: today.toISOString(),
        value: 1,
        note: 'Afternoon glass',
        source: 'ui',
      },
      {
        habitId: buildHabit.id,
        userId: user.id,
        tsClient: yesterday.toISOString(),
        value: 1,
        note: 'Morning glass',
        source: 'ui',
      },
    ],
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })