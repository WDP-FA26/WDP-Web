# AGENTS.md

Turborepo + pnpm monorepo. Next.js 16 / React 19 / TS 5.9. Apps use App Router (`apps/*/app/`).

## Package manager

- Use `pnpm` only (`packageManager: pnpm@10.16.1`, `engines: node >= 18`). Do not use npm/yarn.
- Install: `pnpm install`. Run repo tasks from root via turbo; single-package via filter.

## Commands

- `pnpm dev` — starts all apps (turbo `dev` is `persistent`, no cache).
- `pnpm build` / `turbo build --filter=<web|dashboard|admin|@repo/ui>`
- `pnpm lint` / `turbo lint --filter=<name>` — fails on any warning (`--max-warnings 0`).
- `pnpm check-types` / `turbo check-types --filter=<name>` (`tsc --noEmit` per package).
- `pnpm format` — `prettier --write "**/*.{ts,tsx,md}"` only; no prettier config file (defaults).
- Verify order: `lint` → `check-types` → `build`. No test runner exists — do not add `test` scripts or expect vitest/jest/playwright.

## Microfrontends (non-obvious)

- `apps/web` is the shell/host. Only it has `microfrontends.json`: `web :3000`, `dashboard :3001` routed at `/dashboard/*`, `admin :3002` at `/admin/*`. Proxied entry is `localhost:3024` per root README.
- All three apps run `next dev --port $(turbo get-mfe-port)` — never hardcode ports or simplify to `next dev`. Single-app dev (`turbo dev --filter=dashboard`) still needs Turbo to resolve the port.
- To change ports/routes, edit `apps/web/microfrontends.json` only; `dashboard`/`admin` have no such file.

## Structure

- `apps/{web,dashboard,admin}` — private Next.js apps, `type: module`, each depends on `@repo/ui` via `workspace:*`.
- `packages/ui` — shared React components, no build step (source consumed directly). Exports map is `"./*": "./src/*.tsx"`, so import as `@repo/ui/button`, never `@repo/ui/src/button`. New component: `turbo gen react-component` (script `generate:component` on `@repo/ui`).
- `packages/typescript-config` — `base.json` / `nextjs.json` / `react-library.json`; apps extend `@repo/typescript-config/nextjs.json`.
- `packages/eslint-config` — `base.js` / `next.js` / `react-internal.js`; Next apps do `import { nextJsConfig } from "@repo/eslint-config/next-js"`.

## Gotchas

- Root `README.md` is stale starter boilerplate (mentions a `docs` app that does not exist). Trust `apps/*` + `pnpm-workspace.yaml`, not the README app list.
- `turbo.json` `build` inputs include `.env*` — env changes invalidate build cache; `.env*.local` files are gitignored per-app.
- `check-types` configs set `strictNullChecks: true`, `noEmit`, `jsx: preserve`, `moduleResolution: Bundler`.
