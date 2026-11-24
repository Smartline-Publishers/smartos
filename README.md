# SmartOs Web

Next.js 14 + TypeScript + Tailwind CSS frontend for SmartOs.

Consumes the sibling backend repo `../smartos-backend` (API contracts: `../smartos-backend/docs/API_CONVENTIONS.md`, OpenAPI at `/swagger-ui.html`).

## Setup

```bash
npm install
# create a local .env.local (never committed — company policy excludes
# all env files from git) with:
#   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
npm run dev
```

## Env

| Var | Where | Description |
| --- | ----- | ----------- |
| `NEXT_PUBLIC_API_URL` | build + runtime | Backend base URL (must include `/api/v1`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | build + runtime | Clerk publishable key (`pk_...`) |
| `CLERK_SECRET_KEY` | **runtime only** | Clerk secret key (`sk_...`). `clerkMiddleware()` throws if missing. |

> Cloudflare **build variables** are not visible to the Worker at runtime, so
> `CLERK_SECRET_KEY` must reach the Worker as a deployed secret. `npm run deploy`
> handles that automatically: `scripts/cf-deploy.cjs` reads the value from the
> build environment and uploads it with `--secrets-file`. `wrangler.jsonc`
> declares it under `secrets.required`, so a deploy fails with a clear message
> instead of shipping a Worker that 500s on every request.

## Deploy

Cloudflare Workers Builds runs:

```bash
npm run build    # next build
npm run deploy   # opennextjs-cloudflare build -> strip-self-ref -> cf-deploy
```

`CLERK_SECRET_KEY` must be present in the build environment (Workers Builds →
Settings → Variables and Secrets). The public `NEXT_PUBLIC_*` values live in
`wrangler.jsonc` `vars` so runtime bindings stay deterministic.

`GET /api/health` reports whether the deployed Worker can actually see the Clerk
keys (booleans only, never values). It bypasses Clerk middleware, so it stays
reachable while auth is misconfigured.

## Structure

```
src/
  app/            # App Router pages (dashboard, books, contributors, users, login)
  components/ui/  # Hand-rolled reusable primitives
  components/layout/ # AppShell, TopBar, ProtectedRoute
  features/       # Per-domain api + forms + tables (books, contributors, auth, dashboard)
  hooks/          # use-paged-query, use-auth
  lib/            # api-client, auth tokens, format, cn
  types/          # api envelope, auth, book, dashboard
middleware.ts     # / -> /dashboard redirect (see comment for httpOnly-cookie upgrade)
```

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — next lint
- `npm run test` — vitest run
