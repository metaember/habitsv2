import { z } from 'zod'

// Habit DTOs
export const HabitCreateDto = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().optional(),
  type: z.enum(['build', 'break']),
  target: z.number().positive(),
  period: z.enum(['day', 'week', 'month', 'custom']).default('day'),
  scheduleDowMask: z.number().int().min(0).max(127).optional(),
  unit: z.enum(['count', 'minutes', 'custom']).default('count'),
  unitLabel: z.string().min(1).max(12).optional(),
})

export type HabitCreateInput = z.infer<typeof HabitCreateDto>

// Event DTOs
export const EventCreateDto = z.object({
  value: z.number().positive().default(1),
  note: z.string().max(280).optional(),
  tsClient: z.string().datetime().optional(), // ISO 8601 string
  clientId: z.string().max(64).optional(),
})

export type EventCreateInput = z.infer<typeof EventCreateDto>

// Void Event DTOs
export const VoidEventDto = z.object({
  reason: z.enum(['mistap', 'wrong_time', 'other']).optional(),
})

export type VoidEventInput = z.infer<typeof VoidEventDto>