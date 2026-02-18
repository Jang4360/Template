# AGENTS Guide

This file defines the non-negotiable delivery and safety rules for this template repository.
All contributors, human or agent-based, must follow these rules for every worktree and PR.

## Security Rules
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client bundles, browser runtime, or public env vars.
- Client-side Supabase access is limited to anon key usage only.
- Privileged database actions run server-side only with controlled access paths.
- Secrets must be stored in environment management systems, not committed to git.

## Supabase RLS Baseline
- RLS is ON by default for all application tables.
- Creating tables without enabling RLS is prohibited.
- Shipping tables with no policies is prohibited.
- Policy intent and coverage must be documented in migration notes or runbooks.

## PR Done Definition
A PR is complete only when all conditions below are satisfied:
- Full Gate passes: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Minimum test requirement is met: at least one meaningful test for changed behavior.
- Scope, risk, and rollback strategy are documented in PR template.
- Reviewer can reproduce verification steps locally.

## Worktree and PR Naming
Use deterministic names for traceability:
- Worktree branch format: `codex/<type>/<ticket-or-topic>`.
- PR title format: `<type>: <short summary>`.
- Recommended types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- Keep branch and PR names aligned to the same work item.

## Gate Failure Handling
If any gate fails, do not request review or merge:
- Stop and identify the failing command and root cause.
- Push a fix commit that addresses only the failure or tightly related issues.
- Re-run Full Gate locally.
- Update PR testing section with failure cause and recovery summary.

## Security Mandatory Rules (Must Follow)

1) Never expose Supabase `service_role` key to client code, client components, or browser bundles. Use it only in server-only modules and webhook handlers. :contentReference[oaicite:42]{index=42}

2) RLS is the source of truth. Any table accessed from the client must have RLS enabled and policies for SELECT/INSERT/UPDATE/DELETE. :contentReference[oaicite:43]{index=43}

3) All write operations must be enforced twice:
   - Server guard (requireUser/requireRole)
   - DB RLS `WITH CHECK` (ownership/role constraints)

4) Do not trust client-provided identifiers (user_id, owner_id, org_id, plan_key). Derive user identity from `auth.uid()` and validate ownership via RLS. :contentReference[oaicite:44]{index=44}

5) Webhook endpoints must implement:
   - Signature/verification (when available)
   - DB-backed idempotency via unique(provider,event_id)
   - Raw payload + headers storage for auditing

6) Stripe webhook verification must use the raw request body (no JSON parsing before signature verification). :contentReference[oaicite:45]{index=45}

7) Toss Payments confirm/approval must be performed server-side and must verify amount/order integrity before calling the PG API. :contentReference[oaicite:46]{index=46}

8) Never log secrets or sensitive tokens. Redact: access/refresh tokens, paymentKey, webhook signatures, and personal data.

9) Any new dependency must be justified and kept minimal. Prefer proven libraries. Run vulnerability checks in CI.

10) Admin routes must be protected by both middleware routing restrictions and server-side authorization checks (defense in depth).

## Codex Prompt: Next.js(App Router) + Supabase(RLS ON) + Billing Security Guardrails

You are implementing features in this codebase. Optimize for speed, but NEVER violate these security constraints.

### The 7 most common vulnerabilities in this stack (and mandatory mitigations)

1) RLS Misconfiguration / Missing Policies (Broken Access Control)
- Risk: Any table without correct RLS leaks data via Supabase API.
- Must:
  - Enable RLS on every public table.
  - Define SELECT/INSERT/UPDATE/DELETE policies.
  - Use ownership + role override patterns.
  - Explicitly handle unauthenticated `auth.uid()` == null. :contentReference[oaicite:47]{index=47}

2) service_role Key Leakage
- Risk: service_role bypasses RLS -> total data compromise.
- Must:
  - service_role only in server-only modules & webhook handlers.
  - Never import server-only modules into client components.
  - Never print keys in logs. :contentReference[oaicite:48]{index=48}

3) Webhook Forgery / Missing Verification
- Risk: Attacker calls webhook endpoint and upgrades themselves to paid.
- Must:
  - Verify Stripe signature with raw body. :contentReference[oaicite:49]{index=49}
  - For Toss: store transmission-id, apply idempotency, and cross-check state via server-to-server API when verification is not universal. :contentReference[oaicite:50]{index=50}
  - Webhook is a signal; the database state must be updated only after verification/cross-check.

4) Webhook Replay / Duplicate Processing (No Idempotency)
- Risk: duplicate events create duplicate entitlements or double-refunds.
- Must:
  - Insert webhook event first with unique(provider,event_id).
  - If conflict, return 200 and do nothing.
  - Process state updates in a DB transaction.

5) Payment Amount Tampering / Order Integrity Failure
- Risk: client changes amount/orderId to pay less.
- Must:
  - Confirm payments server-side only.
  - Compare DB order amount with callback amount before approving.
  - Use unpredictable order ids (UUID/ULID).
  - Keep a strict state machine for order/payment status. :contentReference[oaicite:51]{index=51}

6) Session/Auth Handling Errors (Cookie flags, SSR confusion)
- Risk: auth bypass or token theft.
- Must:
  - Use Supabase SSR cookie-based auth (`@supabase/ssr`).
  - Protect admin routes with middleware + server checks.
  - Avoid storing tokens in localStorage for SSR flows. :contentReference[oaicite:52]{index=52}

7) Secrets in Repo / Vulnerable Dependencies
- Risk: leaked API keys, known CVEs.
- Must:
  - Enable secret scanning (GitHub Secret Scanning + gitleaks).
  - Run dependency vulnerability checks in CI.
  - Keep dependencies minimal and updated. :contentReference[oaicite:53]{index=53}

### Output requirements
- Prefer simple designs over complex abstractions.
- Every new API route must include input validation, auth guard, and RLS-safe DB calls.
- If implementing billing/admin/auth, update SECURITY_CHECKLIST.md accordingly.
