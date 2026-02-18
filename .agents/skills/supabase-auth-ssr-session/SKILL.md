# Skill: supabase-auth-ssr-session

## Purpose
Implement SSR-based authentication using Supabase with secure cookie handling.

## Triggers
- Adding login/logout
- Protecting routes
- Accessing user session server-side

## Canonical References
- AGENTS.md
- SECURITY_CHECKLIST.md (Auth section)

## Responsibilities
- Create browser and server Supabase clients
- Enforce cookie-based session flow
- Protect admin routes

## Implementation Steps
1. Create `createBrowserClient` and `createServerClient`.
2. Store session in secure cookies.
3. Implement middleware-based session refresh.
4. Implement `requireUser()` and `requireRole()` helpers.

## Required Artifacts
- packages/auth/*
- middleware.ts
- app/login/page.tsx

## Verification
- SSR `getUser()` works
- Admin routes blocked for unauthorized users
