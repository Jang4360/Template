# Contributing Guide

This repository is a template baseline, so changes must prioritize stability and reproducibility.
Contributions should improve default quality without adding unnecessary complexity.

## Development Flow
1. Create branch with `codex/<type>/<topic>` naming.
2. Keep each branch focused on one concern.
3. Commit in small, meaningful units with clear messages.
4. Open PR using the required template.
5. Address review comments with follow-up commits.

## Local Requirements
- Node.js 20+
- pnpm 10+
- Git configured for signed or identifiable commits

## Full Gate Before PR
Run all commands locally before requesting review:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `bash scripts/check.sh` when available

## Testing Expectations
- Every behavior change must include or update at least one test.
- Refactor-only changes should still confirm no regression via Full Gate.
- Document manual verification steps when automated coverage is insufficient.

## Documentation Expectations
- Update docs with code changes that alter workflow, architecture, or operations.
- Keep examples executable and command snippets current.
- Avoid placeholder sections with no actionable details.

## Security and Secrets
- Never commit production secrets.
- Never expose service-role credentials in browser-accessible code.
- Validate RLS posture for schema changes.

## Merge Readiness
A PR is merge-ready only when CI is green, review feedback is addressed,
and rollback steps are documented in the PR description.
