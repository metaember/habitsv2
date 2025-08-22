# Habit Tracker — Detailed Roadmap & Technical Specification

**Stack:** Next.js (App Router, Node runtime) • TypeScript • Prisma ORM • Postgres (self-hosted)
**Architecture:** event-sourced (immutable Event records) • single repo monolith (UI + API)
This document is the authoritative plan for implementation and for code-gen tools.

## 0) Conventions & guardrails

- **Event-sourced:** never mutate or delete events; "edits" are compensating events.
- **Time & periods:** compute in the user's timezone; centralized helpers (§7.2).
- **DST:** period boundaries are local wall time; 23/25-hour days are acceptable.
- **Validation:** Zod for request/response. Generate Zod models from Prisma via prisma-zod-generator where useful; compose request DTOs by pick/omit/extend.
- **Types:** import row & payload types from `@prisma/client`; use `Prisma.validator()` for typed includes/selects.
- **Accessibility:** hit areas ≥ 44×44 px; explicit labels for VoiceOver; color+icon for state.
- **Security:** API tokens only for v3 webhooks; no public DB ports.

*Out of scope here:* proxy/edge routing/TLS.

## 1) Repository layout

```
/app
  /today                    # v0
  /habit/[id]               # v0
  /settings                 # v0
  /calendar                 # v1
  /api
    /health                 # v0
    /habits                 # v0: GET, POST
    /habits/[id]/events     # v0: GET, POST
    /export.jsonl           # v0: GET
    /import.jsonl           # v1: POST
    /calendar               # v1: GET month cells
    /webhook/habits.log     # v3: POST
/components
  HabitCard.tsx             # v0
  LogSheet.tsx              # v0
  StatStrip.tsx             # v0
  CalendarHeatmap.tsx       # v1
  DayDrawer.tsx             # v1
/lib
  db.ts                     # Prisma client singleton
  period.ts                 # DST-safe period math
  stats.ts                  # streaks, adherence, on-pace
  export.ts                 # JSONL encode/decode
  validation.ts             # zod DTOs
  auth.ts                   # v2+
/prisma
  schema.prisma
/scripts
  seed.ts
/tests
  period.spec.ts
  streaks.spec.ts
  api.spec.ts
/docs
  SPEC.md (this file)
  API.md (extracted endpoints & DTOs for clients)
README.md
```

## 2) Data model (Prisma)

*(Baseline with forward-compat fields so later versions avoid breaking migrations.)*

```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum HabitType { build, break }
enum Period    { day, week, month, custom }
enum Unit      { count, minutes, custom }
enum Visibility{ private, household, group, public_link }
enum Source    { ui, import, webhook, puller, other }

model User {
  id        String  @id @default(uuid())
  name      String
  color     String?
  timezone  String  @default("America/New_York")
  Habits    Habit[]
  Events    Event[]
}

model Habit {
  id              String   @id @default(uuid())
  ownerUserId     String?
  owner           User?    @relation(fields: [ownerUserId], references: [id])
  name            String
  emoji           String?
  type            HabitType
  target          Float
  period          Period
  scheduleDowMask Int?
  unit            Unit      @default(count) // v1 uses
  unitLabel       String?
  windowStart     String?   // "HH:mm"
  windowEnd       String?
  templateKey     String?   // v2 merged tiles
  visibility      Visibility @default(private)
  active          Boolean    @default(true)
  events          Event[]
}

model Event {
  id        String  @id @default(uuid())
  habitId   String
  habit     Habit   @relation(fields: [habitId], references: [id])
  userId    String?
  user      User?   @relation(fields: [userId], references: [id])
  tsClient  DateTime
  tsServer  DateTime @default(now())
  value     Float    @default(1)
  note      String?
  source    Source   @default(ui)
  clientId  String?  // idempotency
  meta      Json?
  @@index([habitId, tsServer])
  @@index([userId, tsServer])
}
```

## 3) API (cumulative; Zod DTOs in §7.4)

### v0 endpoints

- `GET /api/health` → `{ ok: true }`
- `GET /api/habits` → `Habit[]`
- `POST /api/habits` → create habit
- `GET /api/habits/:id/events?from&to` → `Event[]` (server-sorted)
- `POST /api/habits/:id/events` → log event
- `GET /api/export.jsonl` → newline-delimited habit|event stream

### v1 additions

- `POST /api/import.jsonl` → dry-run option; validates and dedupes
- `GET /api/calendar?month=YYYY-MM&habit_id=` → day cells payload

### v2 additions

*none (UI & auth only)*

### v3 additions

- `POST /api/webhook/habits.log` (header `X-Webhook-Token`) → `202 {event_id}`

### v4–v6 additions

stats cache endpoints (v4) • groups/challenges CRUD (v6)

## 4) Versioned feature plan

### v0 — Single user, core logging & basic stats

#### Views

**Today**
- Cards for each active habit.
- Build: +1 button; progress ring toward target; streak chip.
- Break: Log incident button; "days clean" chip.
- Micro stats: 2/4 this week, "On-track/At-risk" (simple linear on-pace).
- Empty state with CTA to New Habit.

**Habit Detail**
- Header: emoji, name, type, target, period.
- KPIs: Streak (build) or Time since last failure (break), adherence % (30d).
- Event list (last N): timestamp (local), value, note, source.

**New/Edit Habit**
- Fields: name (1..60), emoji (optional), type (build|break), target (int>0), period (day|week|month), schedule_dow_mask (optional), notes (0..280 optional).
- Preview chip ("This week: 0/4").

**Log Entry (modal)**
- Build: value defaults to 1 (numeric field present but hidden).
- Break: incident boolean → value=1.
- Optional note; Undo toast (5–10 s).

**All Habits / Manage**
- List, reorder (client-side order persisted), archive/unarchive.

**Settings**
- Theme, text size, haptics toggle.
- Kiosk lock (PIN/FaceID).
- Export JSONL button with download.

#### Server logic

- Create habit: coerce target to int in v0; store numeric anyway.
- Post event: set `tsServer=now()`; `tsClient=now()` unless provided.
- Edit window: if UI offers "undo" only, do not delete; write compensating event if you add edits later.
- Export: stream habits first, then events; avoid buffering full file.

#### Validations

- Habit: name required; type must be enum; target >= 1; period enum; schedule_dow_mask ∈ [0,127].
- Event: value > 0 (break incidents use 1); note ≤ 280 chars.
- Time range (from, to): ISO 8601; from <= to; clamp to sane window.

#### Core semantics

- Build success: `sum(value in period) ≥ target`.
- Break success: `count(incidents in period) ≤ 0` (v0).
- Streak: consecutive successful closed periods.
- Time since failure: `now - max(incident.ts)`.

#### Definition of done (v0)

- Tests: period boundaries (Mon vs Sun), DST ±1h, streak across month.
- Today & Detail update immediately after logging.
- Export → file opens as JSONL; lines validate.

*Out of scope (v0):* Calendar view; import; units (minutes/glasses); multi-user; webhooks.

### v1 — Units/quantities, Calendar, Round-trip import/export

#### Additions to data/UI

- `unit` (count|minutes|custom) and `unitLabel` visible in UI.
- Log Entry shows numeric keypad with quick presets:
  - count: +1 / +2
  - minutes: +5 / +10
  - custom: recent values

**Calendar (month)**
- Build: cell intensity by progress/target; success badge on period end.
- Break: green = clean day; red tick = incident.
- Tap day → Day Drawer: per-habit events (read-only) and "Log today" (today only).

#### Import/export

- Export JSONL stays canonical:
  - `{"kind":"habit", ...}` then `{"kind":"event", ...}`
- Import JSONL:
  - `?dryRun=1` to validate only.
  - Dedup rule: ignore if an event exists with same tuple (habit_id, ts_client, value, client_id?) or same content hash.
  - Report line numbers and reasons for rejected rows.

#### Validations

- Habit: target > 0 (float ok), unitLabel 1..12 if unit != count.
- Event: value > 0; allow decimals for minutes/custom.

#### Definition of done (v1)

- Logging minutes toward 120 min/week shows partial progress on Today & Calendar.
- Export→delete DB→Import reproduces the state; counts match; no dupes.

*Out of scope (v1):* Multi-user; webhook; pullers; stats drawer beyond basics.

### v2 — Household multi-user & merged displays

#### Auth

- Auth.js with email magic links or passkeys.
- Store sessions in Postgres via Prisma adapter.
- Add `ownerUserId` on habits; require `userId` on new events; backfill legacy events to a default user.

#### UI

- Profile chips (top bar): switch active user; colored by `User.color`.
- Merged tiles on Today: habits with same `templateKey` display as one card with per-user progress sub-rings and small initials.
- Calendar overlays: per-user color legend; tap day shows entries grouped by user.
- Visibility per habit: private|household.

#### Validations

- Sessions required to log events; active user context applies.
- Creating a merged tile: enforce non-empty `templateKey` on related habits.

#### Definition of done (v2)

- Two users can log to "Gym" (3× vs 4× weekly) and see one merged tile with two progress rings.
- Calendar distinguishes entries by user color and legend.

*Out of scope (v2):* External groups; webhooks.

### v3 — Ingress (webhook, scheduled pullers) & minimal egress

#### Endpoints

- `POST /api/webhook/habits.log`
  - Header: `X-Webhook-Token: <secret>`
  - Body: `{ habit_id, user_id?, value, ts?, note?, client_id? }`
  - Behavior: idempotent on `client_id`; otherwise create new event.
  - Response: `202 { event_id }` (or 409 duplicate).

#### Pullers (server cron)

- Configuration (internal or persisted): target URL, schedule (cron), adapter function name.
- Adapter maps external JSON → `{ habit_id, user_id?, value, ts?, note?, client_id? }[]`

#### Integrations screen (UI)

- Show webhook URL & last 10 inbound events and statuses.
- Show configured pullers and last run times.

#### Validations

- Reject if `habit_id` not found, or `value <= 0`, or token missing.
- Clamp/parse `ts`; fallback to server time if invalid.

#### Definition of done (v3)

- Posting to webhook appears in Today/Detail immediately.
- Puller runs on schedule; failures show cause; no duplicate inserts.

### v4 — Expanded statistics & data browser

#### Stats Drawer (per habit)

- Rolling 7-day activity sparkline (event counts/values).
- Adherence (30/90 days).
- Best streak / longest clean run.
- Typical time-of-day histogram (24×1h bins).
- Trend slope over last 8 periods; "On-pace" indicator.

#### Data Browser

- Filter by habit & date range; table of events; export selected rows to CSV/JSON.

#### Performance

- Nightly job writes `ComputedStat` per habit+period; on new event, recompute current period only.

#### Validations

- Stats recompute deterministically from events; test parity between cache and on-the-fly recomputation.

#### Definition of done (v4)

- Drawer values match recomputation for random samples.
- Browser filters align with API; export matches displayed rows.

### v5 — Simple gamification

#### Rules

- Award points per successful period (not per tap), e.g., +10.
- Streak multipliers: 7/30/100 → ×1.0/×1.5/×2.0.
- Break habits: either deduct on incident (e.g., −5) or award only on clean period.
- Points are recomputable from events + streaks (cache optional).

#### UI

- Confetti/haptics on success (toggle in Settings).
- Points chip in Habit Detail; list of badges (7d, 30d, 100d).

#### Definition of done (v5)

- Points tally equals deterministic recomputation; UI feedback fires only on period success.

### v6 — Groups & challenges (cross-household)

#### Models

- `Group{id, name}` / `GroupMember{group_id,user_id}`
- `Challenge{id, group_id, template_key, type:individual|pooled, target, window}`
- `Assignment{challenge_id,user_id,target}` (for individual goals)

#### UI

- Groups: list, join via code, leave.
- Challenges: cards showing progress; leaderboards.

#### Rules

- Shared individual goal: same template, per-user targets.
- Pooled goal: sum of member events toward one target.
- Late logs apply to the period containing `ts_client`.

#### Definition of done (v6)

- Leaderboards correct; pooled totals equal member sums; visibility respected.

## 5) Acceptance tests (by topic)

**Period math:**
- Week start Mon vs Sun; DST forward/back; month boundary at midnight local.

**Streaks:**
- Increments only on closed successful periods; break incidents reset "time since failure."

**Import/export:**
- Round-trip reproduces data exactly; dedupe works on tuple/hash; dry-run lists reasons.

**Webhook/pullers:**
- Idempotency with `client_id`; rate limit (basic); token required.

**Stats equality:**
- Cached vs recomputed parity for random subsets.

**Points:**
- Ledger equals recomputation under varied patterns (missed periods, failures).

## 6) "Definition of ready" for each LLM coding pass

- DTOs specified in `validation.ts` (Zod).
- Route handler docstring describing inputs/outputs and error codes.
- Unit tests updated (or stubs provided) for any new helper in `/lib`.

## 7) Implementation details

### 7.1 Server Actions vs Route Handlers

Use Route Handlers (`/app/api/...`) for anything you may later expose to native clients (habit CRUD, events, import/export, webhook).

Server Actions are acceptable for internal mutations tied to forms, but prefer Route Handlers to keep a clear API surface.

### 7.2 Period helpers (sketch)

```typescript
export function periodRange(now: Date, period: Period, weekStart: "MON"|"SUN", tz: string) {
  // Convert `now` to ZonedDateTime, snap to start/end based on `period` and `weekStart`.
  // Return ISO instants for start/end.
}

export function groupEventsByPeriod(events: Event[], period: Period, tz: string) {
  // Bucket by period start; sum values; count incidents for break; return array of {start, end, total, incidents}
}
```

### 7.3 On-pace heuristic

```
onPace = achieved >= target * elapsedFraction
```

`elapsedFraction = (now - start) / (end - start)` in local wall time.

### 7.4 DTOs (Zod samples)

```typescript
export const HabitCreateDto = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().optional(),
  type: z.enum(["build","break"]),
  target: z.number().positive(),
  period: z.enum(["day","week","month","custom"]).default("week"),
  scheduleDowMask: z.number().int().min(0).max(127).optional(),
  unit: z.enum(["count","minutes","custom"]).default("count"),
  unitLabel: z.string().min(1).max(12).optional(),
});

export const EventCreateDto = z.object({
  value: z.number().positive().default(1),
  note: z.string().max(280).optional(),
  tsClient: z.string().datetime().optional(),
  clientId: z.string().max(64).optional(),
});

export const WebhookEventDto = z.object({
  habit_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  value: z.number().positive(),
  ts: z.string().datetime().optional(),
  note: z.string().max(280).optional(),
  client_id: z.string().max(64).optional(),
});
```

## 8) Deployment notes (self-hosted)

- Single Next.js container runs UI and `/api/**`.
- Postgres in a sibling container; run `prisma migrate deploy` on app start.
- Nightly `pg_dump` backups (sidecar cron) recommended.
- Health endpoint `/api/health` for monitoring.
- Scale later: add app replicas; if needed, add PgBouncer and a worker container for scheduled jobs.

## 9) Where to place this file (so LLM tools use it)

- Commit this document as `/docs/SPEC.md` (canonical).
- Add a short `README.md` section linking to `/docs/SPEC.md`.
- For code assistants that scan repo roots (Claude, Qwen, Cursor, Copilot): also add a brief `/AI_GUIDE.md` pointing to `/docs/SPEC.md` and listing the current milestone (e.g., "Implement v0 only").
- If your CLI tool supports a dedicated file (e.g., `claude.md`, `.aider.json`, `.prompt`), place a pointer to `/docs/SPEC.md` and the active checklist; keep only minimal duplication.

**Suggested AI_GUIDE.md contents:**

```
This repo uses /docs/SPEC.md as the single source of truth.
Current milestone: v0 (single user, Today/Habit Detail/Log/All Habits/Settings, JSONL export).
Work only within scope; update tests in /tests when modifying helpers or routes.
```

## 10) Milestone checklist (DoD)

### v0
- [ ] Prisma schema + migrations
- [ ] Today / Habit Detail / Log Entry / All Habits / Settings (export)
- [ ] `period.ts`, `stats.ts` + unit tests
- [ ] API: habits (GET/POST), events (GET/POST), export.jsonl, health
- [ ] Basic accessibility (labels, focus, hit areas)

### v1
- [ ] Units UI (minutes/custom) + quick presets
- [ ] Calendar month view + day drawer
- [ ] Import.jsonl (dry run + dedupe)
- [ ] Round-trip test

### v2
- [ ] Auth.js, sessions, user profile chips
- [ ] Backfill single-user data to default user
- [ ] Merged tiles (templateKey) + per-user colors

### v3
- [ ] Webhook ingress (token, idempotency)
- [ ] Pullers (cron + adapter registry)
- [ ] Integrations screen

### v4
- [ ] ComputedStat cache + nightly job
- [ ] Stats Drawer + Data Browser

### v5
- [ ] Points engine (derived), streak multipliers
- [ ] Confetti/haptics + badges

### v6
- [ ] Groups/challenges models & endpoints
- [ ] Leaderboards and challenge UIs

---

*This specification must be updated before any scope change.*