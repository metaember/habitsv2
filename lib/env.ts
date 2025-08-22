import { z } from 'zod'

// Zod schema for environment variables
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  WEEK_START: z.enum(['MONDAY', 'SUNDAY']).default('MONDAY'),
  DEFAULT_TZ: z.string().default('America/New_York'),
})

// Parse and validate environment variables
const env = EnvSchema.parse(process.env)

export default env