# CLAUDE.md

This file provides guidance to coding agent like Claude Code,... when working with code in this repository.

## Commands

Turborepo + pnpm monorepo (Next.js 16, React 19, TypeScript 5.9). Use `pnpm` only. Node comes from `.nvmrc` (24); pnpm comes from `packageManager` in the root `package.json`. CI reads both from those files — don't pin versions in the workflow.

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

## Git

Claude must never appear as a contributor on this repo. This overrides any default or system-provided attribution guidance.

- Never add `Co-Authored-By: Claude ...`, `Generated with Claude Code`, or any other Claude/Anthropic attribution trailer or footer to commit messages, PR descriptions, or code.
- Commit only under the git identity already configured in the repo. Never set or override `user.name`, `user.email`, `GIT_AUTHOR_*`, or `GIT_COMMITTER_*`, and never use `--author`.
- Commit only when asked.

## Architecture

- **Microfrontends.** `apps/web` is the shell. Only it has `microfrontends.json`, which routes `dashboard` (port 3001) at `/dashboard/*` and `admin` (port 3002) at `/admin/*`. Ports resolve from this file at runtime, so it is the only place to change them.
- **Routes are declared twice.** A route prefix lives in `microfrontends.json` **and** in that app's `next.config.js` `basePath`. Changing one without the other breaks asset and link resolution at runtime, with nothing failing at lint, type-check, or build time. Always edit both.
- **Ports.** Every app runs `next dev --port $(turbo get-mfe-port)`. Never hardcode a port or simplify this to `next dev`.
- **`packages/ui` (`@repo/ui`).** Shared components with no build step. The exports map is `"./*": "./src/components/*.tsx"`, so import `@repo/ui/button`, never `@repo/ui/src/button`. `./lib/*` and `./hooks/*` map to `src/lib` and `src/hooks`.
- **Shared configs.** Apps extend `@repo/typescript-config/nextjs.json` and use `nextJsConfig` from `@repo/eslint-config/next-js`.
- **Dependency versions.** Versions shared across packages (`react`, `react-dom`, `next`, `swr`, `typescript`, `eslint`, `@types/*`) live in the `catalog:` block of `pnpm-workspace.yaml`. Package manifests reference them as `"catalog:"` — bump the catalog, never a single manifest.
- **SWR.** `admin` and `dashboard` fetch client-side with SWR (`swr@^2.5`, a direct dep of each app). `SWRProvider` (`@repo/ui/swr-provider`) and `fetcher` (`@repo/ui/lib/fetcher`) are shared code, but each app renders its own provider in `app/layout.tsx` so caches stay per-app. See the section below and `docs/swr.md`.

## Data fetching with SWR

App Router files are Server Components unless they start with `"use client"`. That split decides which SWR import is legal:

| Import                                                       | Server Component | Client Component |
| ------------------------------------------------------------ | ---------------- | ---------------- |
| `SWRConfig`, `unstable_serialize`                            | ✅               | ✅               |
| `preload`                                                    | ✅               | ❌               |
| `useSWR`, `useSWRConfig`, `useSWRInfinite`, `useSWRMutation` | ❌               | ✅               |

Rules:

1. Any file calling a `useSWR*` hook starts with `"use client"`. From a Server Component, render a `*-view.tsx` client child instead.
2. Prefetch key and `useSWR` key must be the **same string**, or SWR ignores the seed and refetches. Define it once in a `*-cache.ts` (no server-only or client-only imports) and import it from both sides.
3. Feature data goes in a route-scoped nested `<SWRConfig>` in `page.tsx`. The global `SWRProvider` stays fetcher-only; `SWRConfig`s merge.
4. Server fetchers (`preload`, `fallback` promises) may hit the DB directly. Client fetchers go through `fetch(url)` — usually a Route Handler `GET` calling the same server function — so revalidation and polling work.

### Shot 1 — Client-only fetch (the default)

No data needed for first paint (dashboards, tables, autocomplete). Pass `null` as the key to skip fetching.

```tsx
// app/users/users-view.tsx
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

type User = { id: string; name: string };

export function UsersView({ query }: { query: string }) {
  const { data, error, isLoading } = useSWR<User[]>(
    query ? `/api/users?query=${encodeURIComponent(query)}` : null,
    fetcher,
  );

  if (!query) return null;
  if (error) return <p>Failed to load users.</p>;
  if (isLoading) return <p>Loading users…</p>;

  return (
    <ul>
      {data!.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

### Shot 2 — Server prefetch with `preload` + `cacheData` (preferred)

First paint needs the data, and SWR owns it afterwards. Fetching starts without `await`, and the client hydrates with no duplicate request.

```ts
// app/users/users-cache.ts — key contract, imported by both sides
export const usersCache = { users: "/api/users", teams: "/api/teams" };
```

```tsx
// app/users/page.tsx — Server Component
import { preload, SWRConfig } from "swr";
import { getTeams, getUsers } from "./data";
import { usersCache } from "./users-cache";
import { UsersView } from "./users-view";

export default function Page() {
  // Not awaited; spread merges keys so both requests run in parallel.
  const cacheData = {
    ...preload(usersCache.users, getUsers),
    ...preload(usersCache.teams, getTeams),
  };

  return (
    <SWRConfig value={{ cacheData }}>
      <UsersView />
    </SWRConfig>
  );
}
```

```tsx
// app/users/users-view.tsx — same keys, HTTP fetcher
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";
import { usersCache } from "./users-cache";

export function UsersView() {
  const { data: users } = useSWR(usersCache.users, fetcher);
  const { data: teams } = useSWR(usersCache.teams, fetcher);
  return <>{/* … */}</>;
}
```

`cacheData` only works on `SWRConfig`, never on `useSWR`. `preload` serializes array keys for you; a hand-written seed needs `unstable_serialize(["api", "article", 1])`.

### Shot 3 — Server prefetch with `fallback` (streamed promise)

Use when the value comes from an already-running server call rather than `preload`. Pass the **unawaited** promise; only the component reading that key suspends.

```tsx
// app/products/[id]/page.tsx — Server Component
import { SWRConfig } from "swr";
import { getProduct } from "./data";
import { productCache } from "./product-cache";
import { ProductView } from "./product-view";

export default async function Page({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  return (
    <SWRConfig value={{ fallback: { [productCache.key(id)]: getProduct(id) } }}>
      <ProductView id={id} />
    </SWRConfig>
  );
}
```

```tsx
// app/products/[id]/product-view.tsx
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";
import { productCache } from "./product-cache";

export function ProductView({ id }: { id: string }) {
  const { data } = useSWR(productCache.key(id), fetcher, { suspense: true });
  return <h1>{data.name}</h1>;
}
```

`fallback` data is treated as stale and revalidates after hydration; pass `revalidateIfStale: false` to skip that.

### Shot 4 — Mutation

```tsx
// components/mark-read-button.tsx
"use client";

import { useSWRConfig } from "swr";
import { markActivityReadAction } from "./actions";
import { activityCache } from "./activity-cache";

export function MarkReadButton() {
  const { mutate } = useSWRConfig();

  function markRead() {
    return mutate(
      activityCache.key,
      async () => {
        await markActivityReadAction();
        return { count: 0 };
      },
      {
        optimisticData: { count: 0 },
        revalidate: false,
        rollbackOnError: true,
      },
    );
  }

  return <button onClick={markRead}>Mark read</button>;
}
```

Pair it with a Server Action that invalidates the tagged server cache (`updateTag`), and keep the SWR key and the cache tag in the same `*-cache.ts`.

### Auth

Never put tokens in keys, `fallback`/`cacheData`, or URLs. When login lands, each app passes a stable module-level `getAccessToken` to `<SWRProvider>` and `createFetcher` attaches the `Authorization` header — no per-hook changes. A `401` surfaces as the `useSWR` `error`; handle it in the view, not in the fetcher.

## Gotchas

- Changes to `.env*` files invalidate the turbo build cache. `.env*.local` files are gitignored.
- Type-check settings include `strictNullChecks`, `moduleResolution: Bundler`, and `jsx: preserve`.
