# Supabase Directory Guide

This directory contains database assets for template-based product repositories.
Use it to track migration SQL and security posture consistently.

## Directory Layout
- `supabase/migrations`: ordered SQL migration files.
- `supabase/README.md`: usage and conventions.

## Migration Conventions
- Migration filename format: `YYYYMMDDHHMM_description.sql`.
- Keep one logical change per migration when possible.
- Include policy updates in the same migration as table changes.
- Add comments for destructive or high-risk operations.

## Authoring Workflow
1. Draft SQL change with forward and rollback awareness.
2. Validate in local or staging Supabase project.
3. Confirm RLS enabled and policy coverage exists.
4. Commit migration file and update relevant runbooks.

## Safety Notes
- Never embed service-role key in SQL or client code.
- Validate access from anon and authenticated roles.
- Coordinate breaking schema changes with release plan.

## Initial State
`supabase/migrations` is intentionally empty in this template.
Add migration files only when a product repository introduces schema changes.
