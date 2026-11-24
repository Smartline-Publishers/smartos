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

> Cloudflare **build variables** are not visible to the Worker at runtime.
> `CLERK_SECRET_KEY` must also be added under the Worker's
> **Settings → Variables and Secrets** (as a Secret) and deployed. `wrangler.jsonc`
> declares it under `secrets.required`, so `wrangler deploy` fails with a clear
> message when it is missing.

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
