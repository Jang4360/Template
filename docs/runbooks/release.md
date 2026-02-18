# Release Runbook

This runbook defines the standard release flow for repositories cloned from this template.
Use it for both scheduled and urgent releases.

## Preconditions
- CI is green on the merge commit.
- Full Gate passes locally for release branch.
- Required environment variables are set in Vercel.
- Database migrations are reviewed and sequenced.

## Release Steps
1. Confirm PRs included in the release scope.
2. Verify migration plan and backup considerations.
3. Merge to protected branch.
4. Wait for Vercel production deployment to complete.
5. Run smoke checks on critical paths.

## Smoke Checklist
- Homepage and key routes load.
- Authentication and authorization checks succeed.
- No critical errors in logs.
- Data writes succeed with RLS policies active.

## Rollback Procedure
1. Revert release commit or redeploy previous stable commit.
2. If migration is backward-incompatible, apply defined rollback SQL.
3. Validate service health and user-critical flows.
4. Document incident timeline and corrective actions.

## Post-Release
Record release notes, known issues, and follow-up tasks.
