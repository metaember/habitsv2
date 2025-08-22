# API Documentation (v0)

This document describes the API endpoints for the Habit Tracker application.

## Health Check

### GET /api/health

Check the health of the application.

**Response:**
```json
{
  "ok": true
}
```

## Habits

### GET /api/habits

Get a list of all active habits.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "emoji": "string|null",
    "type": "build|break",
    "target": "number",
    "period": "day|week|month|custom",
    "active": "boolean"
  }
]
```

### POST /api/habits

Create a new habit.

**Request Body:**
```json
{
  "name": "string (1-60 characters)",
  "emoji": "string (optional)",
  "type": "build|break",
  "target": "number > 0",
  "period": "day|week|month|custom (default: week)",
  "scheduleDowMask": "number 0-127 (optional)"
}
```

**Response:**
```json
{
  "id": "uuid"
}
```

## Events

### GET /api/habits/:id/events

Get events for a specific habit.

**Query Parameters:**
- `from`: ISO 8601 date (optional)
- `to`: ISO 8601 date (optional)

**Response:**
```json
[
  {
    "id": "uuid",
    "habitId": "uuid",
    "tsClient": "ISO 8601 date",
    "tsServer": "ISO 8601 date",
    "value": "number",
    "note": "string|null",
    "source": "ui|import|webhook|puller|other"
  }
]
```

### POST /api/habits/:id/events

Create a new event for a habit.

**Request Body:**
```json
{
  "value": "number > 0 (default: 1)",
  "note": "string (0-280 characters, optional)",
  "tsClient": "ISO 8601 date (optional)",
  "clientId": "string (0-64 characters, optional)"
}
```

**Response:**
```json
{
  "eventId": "uuid"
}
```

## Void Events

### POST /api/events/:id/void

Void an event.

**Request Body:**
```json
{
  "reason": "mistap|wrong_time|other (optional)"
}
```

**Response:**
```json
{
  "voidEventId": "uuid"
}
```

## Export

### GET /api/export.jsonl

Export all habits and events in NDJSON format.

**Response:**
NDJSON stream with records:
```json
{"kind":"habit", ...}
{"kind":"event", ...}
```