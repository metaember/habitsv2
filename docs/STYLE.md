# Style Guide

This document outlines the coding standards and best practices for the Habit Tracker project.

## TypeScript

- Use TypeScript for all new code.
- Enable strict mode in `tsconfig.json`.
- Use descriptive variable and function names.
- Use PascalCase for types and interfaces.
- Use camelCase for variables and functions.
- Use UPPER_SNAKE_CASE for constants.

## React/Next.js

- Use functional components with hooks.
- Use the App Router for routing.
- Use the `use client` directive for client components when necessary.
- Follow the component structure in the project.

## Prisma

- Use Prisma for database operations.
- Use the Prisma client singleton pattern.
- Use Prisma enums directly when possible.

## Zod

- Use Zod for schema validation.
- Define DTOs in `lib/validation.ts`.
- Validate all external inputs with Zod.

## Testing

- Write unit tests for logic in `/lib` and API handlers in `/tests`.
- Use Vitest for testing.
- Name test files with the `.spec.ts` extension.

## API

- Use RESTful API design principles.
- Use structured error responses with error codes and messages.
- Use consistent naming conventions for endpoints.

## UI

- Use Tailwind CSS for styling.
- Follow accessibility guidelines (hit targets ≥ 44px, proper labels).
- Use shadcn/ui components when available.