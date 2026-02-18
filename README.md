# Template Repo: Next.js + Supabase + Vercel

This repository is a starter template for building product repositories with a stable baseline.
Use this repo as the source for cloning, then develop features through Codex worktrees and PRs.
The stack is intentionally minimal: Next.js App Router, Supabase backend, and Vercel deployment.

## Quickstart
1. Install Node.js 20+ and pnpm.
2. Install dependencies with `pnpm install`.
3. Run development server with `pnpm dev`.
4. Open `http://localhost:3000` and confirm app boots.
5. Copy `.env.example` to `.env.local` when environment variables are added.
6. Keep `NEXT_PUBLIC_*` variables only for values safe to expose in browser.

## Full Gate
Run the full quality gate before opening or updating a PR:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- Optional local check: `bash scripts/check.sh` once script is available
A PR is not complete unless all gate commands pass and testing evidence is attached.

## Supabase
- Default security posture is RLS enabled on all application tables.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or public environment variables.
- Client code should use anon key only, and privileged operations must run server-side.
- Schema changes must be captured as SQL migrations under `supabase/migrations`.
- Read `/docs/runbooks/supabase-rls.md` before creating new tables or policies.

## Vercel
- Deploy preview environments from PRs and production from protected branch merge.
- Configure project environment variables in Vercel project settings, not in source files.
- Keep secrets scoped by environment: Preview, Production, and Development.
- Verify build command and output follow Next.js defaults unless explicitly changed.

## Repository Structure
- `src/app`: Next.js App Router pages and layouts.
- `docs/product`: Product requirement templates and planning artifacts.
- `docs/architecture`: Architecture decisions and ADR records.
- `docs/runbooks`: Operational guides such as release and RLS procedures.
- `.github`: CI workflow and PR template.
- `scripts`: Local automation scripts such as gate checks.
- `supabase/migrations`: SQL migration files managed in order.
