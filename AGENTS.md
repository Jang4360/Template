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
