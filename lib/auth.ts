import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplified for v2
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      color: {
        type: "string",
        required: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "America/New_York",
      },
    }
  }
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user