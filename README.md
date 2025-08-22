# Habits Tracker (v0)

A habit tracking application built with Next.js, TypeScript, and Prisma.

This is v0 of the Habit Tracker, implementing the core single-user features:
- Creating habits (build/break)
- Logging events
- Basic stats on Today and Habit Detail pages
- Immutable event log with Undo via void events
- JSONL export of all habits and events

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database:
   - Create a `.env` file based on `.env.example`
   - Run `npm run prisma:generate` to generate the Prisma client
   - Run `npm run prisma:migrate` to set up the database schema
   - Run `npm run prisma:seed` to populate with demo data
4. Start the development server: `npm run dev`

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:seed`: Seed the database with demo data
- `npm run typecheck`: Check for TypeScript errors
- `npm run lint`: Run ESLint
- `npm test`: Run tests with Vitest

## Project Structure

- `/app`: Next.js App Router pages and API routes
- `/components`: Reusable UI components
- `/lib`: Core logic (db, period, stats, export, validation)
- `/prisma`: Prisma schema and migrations
- `/scripts`: Utility scripts (e.g., seeding)
- `/tests`: Unit and API tests
- `/docs`: Project documentation

## Features

### Today Page
- List of active habits as cards
- Build habits: +1 button, progress ring, streak chip
- Break habits: Log incident button, "days clean" chip
- Micro stats: 2/4 this week, "On-track/At-risk"
- Empty state with CTA to create a habit

### Habit Detail Page
- Header with habit details (emoji, name, type, target, period)
- KPIs: Streak (build) or Time since last failure (break), adherence % (30d)
- Recent events list with "corrected" badge for voided events
- Undo button for each event

### Log Entry
- Build: one-tap +1 with optional note
- Break: one-tap Incident
- Undo toast for 10 seconds after logging

### All Habits
- List with archive/unarchive
- Reordering (client-side, persisted)

### Settings
- Theme, text size, haptics toggle
- Kiosk lock (placeholder)
- Export data button (downloads NDJSON)

## API Endpoints

- `GET /api/health`: Health check
- `GET /api/habits`: List habits
- `POST /api/habits`: Create habit
- `GET /api/habits/:id/events`: List events for a habit
- `POST /api/habits/:id/events`: Log event
- `POST /api/events/:id/void`: Void event
- `GET /api/export.jsonl`: Export data in NDJSON format

## Technology Stack

- **Framework**: Next.js (App Router, Node runtime)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **UI**: Tailwind CSS, shadcn/ui components
- **Testing**: Vitest

## Running Tests

To run the test suite:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## Database Setup

1. Make sure you have PostgreSQL installed and running
2. Create a database for the application
3. Update the `DATABASE_URL` in your `.env` file with the correct connection string
4. Run the Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

## Seeding Data

To seed the database with sample data:
```bash
npm run prisma:seed
```

This will create a demo user and some sample habits and events.

## Exporting Data

To export all data in NDJSON format, use the "Export Data" button in the Settings page or call the API endpoint directly:
```bash
curl http://localhost:3000/api/export.jsonl -o habits-export.jsonl
```

## Development Guidelines

- All new code should be written in TypeScript
- Follow the existing code style and conventions
- Write tests for new functionality
- Use the Prisma client for database operations
- Validate all inputs with Zod schemas
- Follow accessibility guidelines (hit targets ≥ 44px, proper labels)