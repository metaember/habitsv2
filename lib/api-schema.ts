import { z } from 'zod'
import { HabitCreateDto, EventCreateDto, VoidEventDto } from '@/lib/validation'

// Re-exporting DTOs for easier access
export { HabitCreateDto, EventCreateDto, VoidEventDto }

// API Response Schemas
export const HealthCheckResponse = z.object({
  ok: z.boolean(),
})

export const HabitListResponse = z.array(z.object({
  id: z.string().uuid(),
  name: z.string(),
  emoji: z.string().nullable(),
  type: z.enum(['build', 'break']),
  target: z.number(),
  period: z.enum(['day', 'week', 'month', 'custom']),
  active: z.boolean(),
  // Add other fields you want to include in the list response
}))

export const HabitCreateResponse = z.object({
  id: z.string().uuid(),
})

export const EventListResponse = z.array(z.object({
  id: z.string().uuid(),
  habitId: z.string().uuid(),
  tsClient: z.string(), // ISO string
  tsServer: z.string(), // ISO string
  value: z.number(),
  note: z.string().nullable(),
  source: z.enum(['ui', 'import', 'webhook', 'puller', 'other']),
  // Add other fields you want to include in the list response
}))

export const EventCreateResponse = z.object({
  eventId: z.string().uuid(),
})

export const VoidEventResponse = z.object({
  voidEventId: z.string().uuid(),
})

export const ErrorResponse = z.object({
  error: z.object({
    code: z.enum(['BadRequest', 'NotFound', 'Conflict', 'Unauthorized', 'ServerError']),
    message: z.string(),
  }),
})

// Type inference for API responses
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>
export type HabitListResponse = z.infer<typeof HabitListResponse>
export type HabitCreateResponse = z.infer<typeof HabitCreateResponse>
export type EventListResponse = z.infer<typeof EventListResponse>
export type EventCreateResponse = z.infer<typeof EventCreateResponse>
export type VoidEventResponse = z.infer<typeof VoidEventResponse>
export type ErrorResponse = z.infer<typeof ErrorResponse>