# Pull Request Template

## What
- [ ] Describe exactly what changed.
- [ ] List touched modules, routes, or schema objects.
- [ ] Note any behavior visible to end users.

## Why
- [ ] Explain the problem this PR solves.
- [ ] Link issue, ticket, or PRD section.
- [ ] State why this approach was chosen.

## How
- [ ] Summarize implementation strategy.
- [ ] Mention important tradeoffs.
- [ ] Note security implications (especially auth and RLS).

## Testing
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Additional manual checks documented below.

## Rollback
- [ ] Define rollback command or revert strategy.
- [ ] Note migration rollback steps if schema changed.
- [ ] Identify monitoring signals after deploy.
