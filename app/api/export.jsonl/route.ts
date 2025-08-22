// Next.js API route for exporting data in NDJSON format
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/export.jsonl - Export habits and events in NDJSON format
export async function GET() {
  try {
    // Set the response headers for NDJSON
    const headers = {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    }
    
    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fetch all habits
          const habits = await prisma.habit.findMany()
          
          // Stream habits
          for (const habit of habits) {
            const habitRecord = { kind: 'habit', ...habit }
            controller.enqueue(`${JSON.stringify(habitRecord)}\n`)
          }
          
          // Fetch all events
          const events = await prisma.event.findMany()
          
          // Stream events
          for (const event of events) {
            const eventRecord = { kind: 'event', ...event }
            controller.enqueue(`${JSON.stringify(eventRecord)}\n`)
          }
          
          // Close the stream
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
    
    // Return the response with the stream
    return new NextResponse(stream, { headers })
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json(
      { error: { code: 'ServerError', message: 'Failed to export data' } },
      { status: 500 }
    )
  }
}