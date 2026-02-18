# Skill: supabase-rls-standard

## Purpose
Apply standardized Row-Level Security policies.

## Triggers
- Creating new tables
- Modifying ownership rules
- Introducing role-based access

## Canonical References
- SECURITY_CHECKLIST.md (RLS section)
- AGENTS.md

## Responsibilities
- Ensure RLS is enabled
- Apply ownership + role override template
- Index policy columns

## Implementation Steps
1. Enable RLS on new tables.
2. Create SELECT/INSERT/UPDATE/DELETE policies.
3. Use ownership pattern:
   owner_id = auth.uid()
4. Add admin/support override if required.
5. Add index on owner_id or policy columns.

## Required Artifacts
- supabase/migrations/*.sql

## Verification
- RLS smoke test passes
- Unauthorized user cannot access foreign rows
