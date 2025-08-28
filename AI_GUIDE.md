# AI Guide

**Canonical spec:** `/docs/SPEC.md`
**Coding standards:** `/docs/STYLE.md`
**Current milestone:** **v2**

## Rules
- Implement only v2 scope unless this file changes.
- Use Prisma types from `@prisma/client`; validate inputs with Zod DTOs in `/lib/validation.ts`.
- Update or add tests when changing `/lib/period.ts`, `/lib/stats.ts`, or any route handler.
- If you run `npm run dev`, make sure to time it out after a few seconds or the tool will hang for ages.

## Runbook
- Dev: `npm run dev`
- Lint/tests: `npm run lint && npm run typecheck && npm test`
- Build: `npm run build`

## Paths
- App: `/app`
- API: `/app/api`
- Lib: `/lib`
- Tests: `/tests`


## Tools / MCP servers

There are several tools or mcp servers you can and should use as required.

- `context7` - use whenever you need to read the docs on some library you're using. especially if running into some isssues involving a library
- `playwright` - use whenever you need to see your changes reflected in the frontend, or when you want to test some journeys.