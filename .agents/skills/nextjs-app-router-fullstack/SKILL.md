# Skill: nextjs-app-router-fullstack

## Purpose
Standardize fullstack implementation using Next.js App Router (Server Components + Route Handlers).

## Triggers
- Creating new routes or features
- Adding server actions
- Handling cookies or authentication state
- Implementing API routes in /app/api

## Canonical References (Do not duplicate)
- AGENTS.md (Security Rules)
- SECURITY_CHECKLIST.md
- PR-SEQUENCE.md

## Responsibilities
- Enforce correct Server vs Client boundary
- Ensure secure cookie mutation (Route Handler / Server Function only)
- Prevent client-side secrets or server-only imports

## Implementation Steps
1. Use Server Components by default.
2. Use `use client` only when interactive state is required.
3. Cookie read/write must occur only in:
   - Route Handlers
   - Server Actions
4. All API routes must:
   - Validate input
   - Perform auth guard
   - Use RLS-safe DB operations

## Required Artifacts
- app/<feature>/page.tsx
- app/api/<feature>/route.ts
- middleware.ts (if needed)

## Verification
- Fast Gate passes (lint, typecheck, test)
- No server-only modules imported in client components
