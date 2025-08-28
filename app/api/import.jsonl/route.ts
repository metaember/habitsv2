import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const HabitImportDto = z.object({
  kind: z.literal('habit'),
  id: z.string().uuid(),
  name: z.string().min(1).max(60),
  emoji: z.string().optional(),
  type: z.enum(['build', 'break']),
  target: z.number().positive(),
  period: z.enum(['day', 'week', 'month', 'custom']),
  unit: z.enum(['count', 'minutes', 'custom']).default('count'),
  unitLabel: z.string().max(12).optional(),
  active: z.boolean().default(true),
  scheduleDowMask: z.number().int().min(0).max(127).optional(),
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
  templateKey: z.string().optional(),
  visibility: z.enum(['private', 'household', 'group', 'public_link']).default('private'),
})

const EventImportDto = z.object({
  kind: z.literal('event'),
  id: z.string().uuid(),
  habitId: z.string().uuid(),
  tsClient: z.string().datetime(),
  tsServer: z.string().datetime(),
  value: z.number().positive().default(1),
  note: z.string().max(280).optional(),
  source: z.enum(['ui', 'import', 'webhook', 'puller', 'other']).default('import'),
  clientId: z.string().max(64).optional(),
  meta: z.any().optional(),
})

type ImportResult = {
  totalLines: number
  processed: number
  created: number
  skipped: number
  errors: Array<{
    line: number
    error: string
    content: string
  }>
}

/**
 * POST /api/import.jsonl?dryRun=1
 * Import habits and events from JSONL format
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dryRun = searchParams.get('dryRun') === '1' || searchParams.get('dryRun') === 'true'

  try {
    const body = await request.text()
    
    if (!body.trim()) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    const lines = body.trim().split('\n')
    const result: ImportResult = {
      totalLines: lines.length,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: []
    }

    // Parse and validate all lines first
    const validItems: Array<{ type: 'habit' | 'event', data: any, line: number }> = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const json = JSON.parse(line)
        
        if (json.kind === 'habit') {
          const validated = HabitImportDto.parse(json)
          validItems.push({ type: 'habit', data: validated, line: i + 1 })
        } else if (json.kind === 'event') {
          const validated = EventImportDto.parse(json)
          validItems.push({ type: 'event', data: validated, line: i + 1 })
        } else {
          result.errors.push({
            line: i + 1,
            error: `Unknown kind: ${json.kind}. Expected 'habit' or 'event'`,
            content: line
          })
        }
      } catch (error) {
        result.errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : 'Invalid JSON or validation failed',
          content: line
        })
      }
    }

    result.processed = validItems.length

    if (dryRun) {
      // Dry run: just validate and report what would be processed
      return NextResponse.json({
        dryRun: true,
        result,
        message: `Would process ${validItems.length} items (${validItems.filter(i => i.type === 'habit').length} habits, ${validItems.filter(i => i.type === 'event').length} events)`
      })
    }

    // Process habits first, then events
    const habitItems = validItems.filter(item => item.type === 'habit')
    const eventItems = validItems.filter(item => item.type === 'event')

    // Import habits
    for (const item of habitItems) {
      try {
        const existing = await prisma.habit.findUnique({
          where: { id: item.data.id }
        })

        if (existing) {
          result.skipped++
          continue
        }

        await prisma.habit.create({
          data: {
            id: item.data.id,
            name: item.data.name,
            emoji: item.data.emoji,
            type: item.data.type,
            target: item.data.target,
            period: item.data.period,
            unit: item.data.unit,
            unitLabel: item.data.unitLabel,
            active: item.data.active,
            scheduleDowMask: item.data.scheduleDowMask,
            windowStart: item.data.windowStart,
            windowEnd: item.data.windowEnd,
            templateKey: item.data.templateKey,
            visibility: item.data.visibility,
          }
        })

        result.created++
      } catch (error) {
        result.errors.push({
          line: item.line,
          error: error instanceof Error ? error.message : 'Failed to create habit',
          content: JSON.stringify(item.data)
        })
      }
    }

    // Import events (with deduplication)
    for (const item of eventItems) {
      try {
        // Check for existing event with same habitId, tsClient, value combination
        const existing = await prisma.event.findFirst({
          where: {
            habitId: item.data.habitId,
            tsClient: new Date(item.data.tsClient),
            value: item.data.value,
            ...(item.data.clientId ? { clientId: item.data.clientId } : {})
          }
        })

        if (existing) {
          result.skipped++
          continue
        }

        // Check if habit exists
        const habit = await prisma.habit.findUnique({
          where: { id: item.data.habitId }
        })

        if (!habit) {
          result.errors.push({
            line: item.line,
            error: `Habit with ID ${item.data.habitId} not found`,
            content: JSON.stringify(item.data)
          })
          continue
        }

        await prisma.event.create({
          data: {
            id: item.data.id,
            habitId: item.data.habitId,
            tsClient: new Date(item.data.tsClient),
            tsServer: new Date(item.data.tsServer),
            value: item.data.value,
            note: item.data.note,
            source: item.data.source,
            clientId: item.data.clientId,
            meta: item.data.meta
          }
        })

        result.created++
      } catch (error) {
        result.errors.push({
          line: item.line,
          error: error instanceof Error ? error.message : 'Failed to create event',
          content: JSON.stringify(item.data)
        })
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully imported ${result.created} items. Skipped ${result.skipped} duplicates. ${result.errors.length} errors.`
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}