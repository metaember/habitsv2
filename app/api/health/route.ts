// Next.js API route for health check
import { NextResponse } from 'next/server'
import { HealthCheckResponse } from '@/lib/api-schema'

export async function GET() {
  try {
    // In a real implementation, you might want to check database connectivity or other services
    const response = { ok: true }
    HealthCheckResponse.parse(response) // Validate response
    return NextResponse.json(response)
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Health check failed' } },
      { status: 500 }
    )
  }
}