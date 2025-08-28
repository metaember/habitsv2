#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillAuthData() {
  console.log('Starting auth data backfill...')

  // Create a default user for legacy data
  let defaultUser = await prisma.user.findFirst({
    where: {
      name: 'Default User'
    }
  })

  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        name: 'Default User',
        email: 'default@example.com', 
        emailVerified: false,
        timezone: 'America/New_York',
        color: '#64748b',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    console.log(`Created default user: ${defaultUser.id}`)
  }

  // Backfill habits without ownerUserId
  const orphanHabits = await prisma.habit.updateMany({
    where: {
      ownerUserId: null,
    },
    data: {
      ownerUserId: defaultUser.id,
    },
  })
  console.log(`Updated ${orphanHabits.count} habits with default user`)

  // Backfill events without userId
  const orphanEvents = await prisma.event.updateMany({
    where: {
      userId: null,
    },
    data: {
      userId: defaultUser.id,
    },
  })
  console.log(`Updated ${orphanEvents.count} events with default user`)

  console.log('Auth data backfill completed successfully!')
}

backfillAuthData()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })