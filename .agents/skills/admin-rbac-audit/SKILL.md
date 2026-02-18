# Skill: admin-rbac-audit

## Purpose
Standardize Admin dashboard and RBAC behavior.

## Triggers
- Adding admin pages
- Implementing support tooling
- Adding operational controls

## Canonical References
- AGENTS.md
- SECURITY_CHECKLIST.md (Admin section)

## Responsibilities
- Enforce role-based guards
- Keep default admin read-only
- Log write actions

## Implementation Steps
1. Add admin layout in packages/admin.
2. Protect routes via middleware + server guard.
3. Log all write operations into audit_log table.

## Required Artifacts
- packages/admin/*
- audit_log table migration

## Verification
- Non-admin users cannot access admin
- Write actions generate audit log entries
