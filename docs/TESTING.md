# Testing Guide

This document describes the testing approach for the Habit Tracker project.

## Test Framework

We use Vitest for testing. Tests are written in TypeScript and placed in the `/tests` directory.

## Test Structure

- Unit tests for logic in `/lib` (e.g., `period.spec.ts`, `streaks.spec.ts`)
- API tests for routes in `/tests/api.spec.ts`
- Tests should be colocated with the code they test when possible, but for API routes, they are in the `/tests` directory.

## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## Writing Tests

- Use `describe` blocks to group related tests.
- Use `it` blocks for individual test cases.
- Use `expect` for assertions.
- Mock external dependencies when necessary.

## Test Coverage

We aim for comprehensive test coverage, especially for:
- Core logic in `/lib/period.ts` and `/lib/stats.ts`
- API route handlers
- Validation schemas

## Continuous Integration

Tests are run automatically in CI for every pull request.