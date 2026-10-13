# SmartOs Web

Next.js 14 + TypeScript + Tailwind CSS frontend for SmartOs.

Consumes the sibling backend repo `../smartos-backend` (API contracts: `../smartos-backend/docs/API_CONVENTIONS.md`, OpenAPI at `/swagger-ui.html`).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Env

| Var | Description | Default |
| --- | ----------- | ------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL (must include `/api/v1`) | `http://localhost:8080/api/v1` |

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
