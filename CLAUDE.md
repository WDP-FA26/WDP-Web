# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` is a symlink to `README.md`, so it only holds the general project overview. `docs/swr.md` has the full SWR data-fetching rules.

## Commands

Turborepo + pnpm monorepo (Next.js 16, React 19, TypeScript 5.9). Use `pnpm` only.

```bash
pnpm install
pnpm dev                          # all apps; proxied gateway at http://localhost:3024
pnpm turbo dev --filter=dashboard # single app (still resolves port via turbo)
pnpm lint                         # ESLint, fails on any warning
pnpm check-types                  # tsc --noEmit per package
pnpm build
pnpm format                       # Prettier on ts/tsx/md, default config
turbo gen react-component         # scaffold a component in @repo/ui
```

Verify in this order: `lint`, `check-types`, `build`. Any command accepts `turbo <task> --filter=<web|dashboard|admin|@repo/ui>`.

There is no test runner. Do not add `test` scripts or assume vitest, jest, or playwright.

Husky runs lint and check-types on pre-commit, and Commitlint enforces Conventional Commits on commit-msg. CI runs the same checks plus Prettier.

## Architecture

- **Microfrontends.** `apps/web` is the shell. Only it has `microfrontends.json`, which routes `dashboard` (port 3001) at `/dashboard/*` and `admin` (port 3002) at `/admin/*`. To change ports or routes, edit that one file.
- **Ports.** Every app runs `next dev --port $(turbo get-mfe-port)`. Never hardcode a port or simplify this to `next dev`.
- **`packages/ui` (`@repo/ui`).** Shared components with no build step. The exports map is `"./*": "./src/*.tsx"`, so import `@repo/ui/button`, never `@repo/ui/src/button`.
- **Shared configs.** Apps extend `@repo/typescript-config/nextjs.json` and use `nextJsConfig` from `@repo/eslint-config/next-js`.
- **SWR.** `admin` and `dashboard` fetch client-side with SWR. `SWRProvider` (`@repo/ui/swr-provider`) and `fetcher` (`@repo/ui/lib/fetcher`) are shared. Each app renders its own provider in `app/layout.tsx` so caches stay per-app. Hooks like `useSWR` need `"use client"`, so put them in a client child of Server Components. Cache keys must match exactly between prefetch and `useSWR`.

## Gotchas

- Changes to `.env*` files invalidate the turbo build cache. `.env*.local` files are gitignored.
- Type-check settings include `strictNullChecks`, `moduleResolution: Bundler`, and `jsx: preserve`.
