# AI Guide

**Canonical spec:** `/docs/SPEC.md`
**Coding standards:** `/docs/STYLE.md`
**Current milestone:** **v0**

## Rules
- Implement only v0 scope unless this file changes.
- Do not introduce calendar, import, multi-user, webhooks, or jobs.
- Use Prisma types from `@prisma/client`; validate inputs with Zod DTOs in `/lib/validation.ts`.
- Update or add tests when changing `/lib/period.ts`, `/lib/stats.ts`, or any route handler.

## Runbook
- Dev: `npm run dev`
- Lint/tests: `npm run lint && npm run typecheck && npm test`
- Build: `npm run build`

## Paths
- App: `/app`
- API: `/app/api`
- Lib: `/lib`
- Tests: `/tests`