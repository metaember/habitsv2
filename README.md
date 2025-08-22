# Habits Tracker

A habit tracking application built with Next.js, TypeScript, and Prisma.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database:
   - Create a `.env` file based on `.env.example`
   - Run `npm run prisma:migrate` to set up the database schema
4. Start the development server: `npm run dev`

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run typecheck`: Check for TypeScript errors
- `npm run lint`: Run ESLint
- `npm test`: Run tests with Vitest