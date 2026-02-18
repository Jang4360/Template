# Supabase RLS Runbook

RLS is a mandatory baseline for every application table in this template.
This document defines the minimum checks before merging schema changes.

## Core Rules
- Enable RLS immediately when creating a table.
- Do not merge tables with zero policies.
- Keep policies explicit by operation: select, insert, update, delete.
- Validate policy scope for authenticated and service flows.

## Table Creation Checklist
1. Create table.
2. Enable RLS.
3. Add least-privilege policies.
4. Test allowed and denied access patterns.
5. Capture SQL in migration file.

## Policy Design Guidance
- Prefer ownership predicates tied to `auth.uid()`.
- Avoid broad `true` predicates unless table is intentionally public.
- Separate read and write policies for easier auditing.
- Review joins and foreign keys for indirect data exposure.

## Verification
- Run SQL checks in staging environment.
- Confirm anonymous users cannot access protected rows.
- Confirm authenticated users access only allowed rows.
- Confirm service-role usage stays server-side only.

## Incident Response
If unintended access is detected, disable impacted endpoints,
patch policies immediately, and rotate sensitive credentials if needed.
