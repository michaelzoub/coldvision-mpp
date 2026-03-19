# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## MPP (x402-style) Architecture

Uses the `mppx` npm package (official MPP SDK). The server implements three layers:

### `src/mpp/mppxInstance.ts`
Singleton `mppx` instance configured with `tempo` payment method (testnet by default). Exports:
- `mppx` — the Mppx instance used by all supplier routes
- `PATHUSD`, `MPP_RECIPIENT` — shared token/recipient config for `mppx.charge()` calls
- `PRICE_PER_ROW`, `MAX_ROWS`, `MAX_CHARGE` — pricing constants ($0.10/row, max 250 rows)

Required env vars:
- `MPP_SECRET_KEY` — server signing key (auto-generated, stored in shared env)
- `MPP_RECIPIENT_ADDRESS` — wallet that receives payments (optional, defaults to zero address)
- `MPP_TESTNET=false` — set to disable testnet mode

### Consumer (`src/mpp/consumer/`)
Calls external paid services via `tempo` CLI. Key exports:
- `consumeService(serviceId, path, options)` — fires a paid request through tempo
- `discoverServices(search?)` — lists services from the Tempo marketplace
- `getWalletStatus()` — checks wallet address and balance

Consumer HTTP routes (mounted at `/api/mpp/consumer`):
- `GET  /wallet` — wallet status
- `GET  /services?search=` — discover services
- `POST /call` — call a service: `{ serviceId, path, method?, body?, dryRun? }`

### Supplier (`src/mpp/supplier/`)
Exposes API routes gated by `mppx.charge()` middleware (returns HTTP 402 challenge when unpaid).

Routes (mounted at `/api/mpp/supplier`):
- `GET  /potential-polymarket-insiders` — returns most-recent whale_addresses rows, $0.10/row, max 250 rows ($25 max). Dynamic pricing via headers:
  - `X-Rows: <n>` — request exactly n rows (capped at 250)
  - `X-Max-Amount: <$>` — budget in dollars (rows = floor(budget / 0.10))
  - No header → 250 rows ($25.00)
- `GET  /echo` — echo query params (manual x402 controller, for reference)
- `POST /transform` — uppercase body strings (manual x402 controller, for reference)

### Controller (`src/mpp/controller/`)
Manual x402 payment middleware (reference implementation, pre-mppx):
- `requirePayment(config)` — Express middleware enforcing payment via `X-Payment` header
- `paymentInfo(config)` — serves payment requirements at sibling `/payment-info` route

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
