// Next.js API route for exporting data in NDJSON format
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic'

// GET /api/export.jsonl - Export habits and events in NDJSON format
export async function GET() {
  try {
    // Set the response headers for NDJSON
    const headers = {
      'Content-Type': 'application/x-ndjson',
      'Content-Disposition': 'attachment; filename="habits-export.jsonl"',
    }
    
    // Create a custom response with streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fetch all habits
          const habits = await prisma.habit.findMany()
          
          // Stream habits
          for (const habit of habits) {
            const habitRecord = { kind: 'habit', ...habit }
            controller.enqueue(new TextEncoder().encode(`${JSON.stringify(habitRecord)}\n`))
          }
          
          // Fetch all events
          const events = await prisma.event.findMany()
          
          // Stream events
          for (const event of events) {
            const eventRecord = { kind: 'event', ...event }
            controller.enqueue(new TextEncoder().encode(`${JSON.stringify(eventRecord)}\n`))
          }
          
          // Close the stream
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
    
    // Return the response with the stream
    return new Response(stream, { headers })
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to export data' } },
      { status: 500 }
    )
  }
}