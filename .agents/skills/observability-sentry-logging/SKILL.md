# Skill: observability-sentry-logging

## Purpose
Add logging and error tracking with safe redaction.

## Triggers
- Adding API routes
- Implementing billing
- Admin write operations

## Canonical References
- AGENTS.md (No sensitive logs)

## Responsibilities
- Structured logs
- Redact tokens
- Add request-id

## Implementation Steps
1. Add logger utility.
2. Mask sensitive fields.
3. Integrate Sentry (if used).
4. Attach request-id per request.

## Required Artifacts
- packages/observability/*
