# SWR in `admin` and `dashboard` (Next.js App Router)

> Sources (follow these, in this order):
>
> 1. SWR with Next.js: https://swr.vercel.app/docs/with-nextjs
> 2. Next.js client-side fetching with SWR: https://nextjs.org/docs/app/guides/client-side-data-fetching/swr
> 3. SWR getting started: https://swr.vercel.app/docs/getting-started
>
> Installed version: `swr@^2.5.1` in `packages/ui`, `apps/admin`,
> and `apps/dashboard` (`swr` must stay a direct dep of each app because
> app code imports `swr` directly — pnpm requires declared deps).
> `preload` + `cacheData` is stable since SWR 2.5.0.

## What was set up (shared)

`fetcher` and `SWRProvider` live in `@repo/ui` so `admin` and `dashboard`
share one implementation:

- `packages/ui/src/lib/fetcher.ts` → import as `@repo/ui/lib/fetcher`.
  Default JSON fetcher, throws on non-2xx so `useSWR` populates `error`.
  Also exports `createFetcher(getAccessToken?)` — the future auth seam
  (see Shot 6); unused until the apps gain login.
- `packages/ui/src/components/swr-provider.tsx` → import as
  `@repo/ui/swr-provider`. `"use client"` global `<SWRConfig>` that only
  sets the shared `fetcher`.
- `apps/<admin|dashboard>/app/layout.tsx` — wraps `{children}` with
  `<SWRProvider>` (inside `<ThemeProvider>`). Feature data is **not** in
  this global provider.

Sharing is code-only: each app still renders its own `<SWRProvider>`
instance, so SWR caches stay per-app runtime state and never leak across
the MFEs.

## Rule 0: Server Components vs Client Components

App Router components are React Server Components (RSC) by default.

| Import                                 | Server Component | Client Component (`"use client"`) |
| -------------------------------------- | ---------------- | --------------------------------- |
| `SWRConfig` from `"swr"`               | ✅               | ✅                                |
| `preload` from `"swr"`                 | ✅               | ❌ (server only)                  |
| `unstable_serialize` from `"swr"`      | ✅               | ✅                                |
| `useSWR` from `"swr"`                  | ❌               | ✅                                |
| `useSWRInfinite` from `"swr/infinite"` | ❌               | ✅                                |
| `useSWRMutation` from `"swr/mutation"` | ❌               | ✅                                |
| `useSWRConfig` from `"swr"`            | ❌               | ✅                                |

Rules for agents:

1. **Never** call `useSWR` / `useSWRMutation` / `useSWRConfig` in a file
   without `"use client"` at the top. Create a `*-view.tsx` client child
   instead and render it from the Server Component.
2. The `fallback` / `cacheData` key and the `useSWR` key must match
   **exactly** (same string). If they drift, SWR ignores the prefetched
   value and refetches on the client.
3. Scope feature data to the route: use a **nested** `<SWRConfig>` in the
   route's `page.tsx`, not the global provider. `SWRConfig`s merge, and the
   global one only provides `fetcher`.
4. Define each key once in a `*-cache.ts` contract (no server-only or
   client-only imports) and import it from both the server file and the
   client file.
5. Server `preload` fetchers may hit the DB directly; client `useSWR`
   fetchers must go through `fetch(url)` (usually a Route Handler `GET`
   that calls the same server function) so revalidation/polling works.

## Shot 1: Client-only fetch (default, no pre-render)

Use when SEO/initial paint does not need the data (dashboards, admin tables,
autocomplete). No special setup beyond the global provider.

```tsx
// app/users/users-view.tsx
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

type User = { id: string; name: string };

export function UsersView() {
  const { data, error, isLoading } = useSWR<User[]>("/api/users", fetcher);

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

Conditional key (don't fetch until input exists):

```tsx
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

export function ProductAutocomplete({ query }: { query: string }) {
  const {
    data = [],
    error,
    isLoading,
  } = useSWR(
    query ? `/api/products?query=${encodeURIComponent(query)}` : null,
    fetcher,
  );

  if (!query) return null;
  if (error) return <p>Failed to load products.</p>;
  if (isLoading) return <p>Loading products…</p>;
  return (
    <ul>
      {data.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

Suspense variant (loading UI lives in the nearest `<Suspense>` boundary;
keeps the interactive shell mounted while results load):

```tsx
"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

export function ProductAutocomplete({ query }: { query: string }) {
  if (!query) return null;
  return (
    <Suspense fallback={<p>Loading products…</p>}>
      <ProductResults query={query} />
    </Suspense>
  );
}

function ProductResults({ query }: { query: string }) {
  const { data } = useSWR(`/api/products?query=${query}`, fetcher, {
    suspense: true,
  });
  return (
    <ul>
      {data.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

## Shot 2: Server-prefetch via `fallback` (Next.js-recommended, stable)

Use when the first paint needs the data (SEO, detail pages) but SWR should
own it in the browser afterwards. The server passes an **unawaited** promise
as `fallback`; React streams it through the RSC payload and only the
component reading that key suspends.

```ts
// app/products/[id]/product-cache.ts — shared key contract, no I/O imports
export const productCache = {
  key: (id: string) => `/api/products/${id}`,
};
```

```tsx
// app/products/[id]/page.tsx — Server Component
import { Suspense } from "react";
import { SWRConfig } from "swr";
import { getProduct } from "./data";
import { productCache } from "./product-cache";
import { ProductView } from "./product-view";

export default function Page({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      {params.then(({ id }) => (
        <ProductData id={id} />
      ))}
    </Suspense>
  );
}

function ProductData({ id }: { id: string }) {
  return (
    <SWRConfig value={{ fallback: { [productCache.key(id)]: getProduct(id) } }}>
      <ProductView id={id} />
    </SWRConfig>
  );
}
```

```tsx
// app/products/[id]/product-view.tsx — Client Component, same key
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";
import { productCache } from "./product-cache";

export function ProductView({ id }: { id: string }) {
  const { data } = useSWR(productCache.key(id), fetcher, { suspense: true });
  return <h1>{data.name}</h1>;
}
```

Notes:

- `fallback` revalidates in the browser after hydration by default (treat as
  stale). Pass `revalidateIfStale: false` to skip the mount revalidation
  (applies to every mount), or `refreshInterval` for polling. Focus /
  reconnect / `mutate` still revalidate.
- The SWR key should point at a Route Handler `GET` (e.g.
  `app/api/products/[id]/route.ts`) that calls the same `getProduct`, so
  client revalidation hits HTTP while the initial render used the DB.

## Shot 3: Server-prefetch via `preload` + `cacheData` (SWR-recommended)

Same goal as Shot 2, but fetching starts earlier (in the layout/page without
awaiting) and SWR hydrates the client cache with **no duplicate initial
request**. Requires `swr@>=2.5` (we have `^2.5.1`).

```tsx
// app/users/page.tsx — Server Component
import { preload, SWRConfig } from "swr";
import { UsersView } from "./users-view";
import { getUsers } from "./data";

export default function Page() {
  // Starts fetching immediately; NOT awaited. Merge with spread for
  // multiple keys so requests run in parallel.
  const cacheData = {
    ...preload("/api/users", getUsers),
    ...preload("/api/teams", getTeams),
  };

  return (
    <SWRConfig value={{ cacheData }}>
      <UsersView />
    </SWRConfig>
  );
}
```

```tsx
// app/users/users-view.tsx — Client Component, same keys + HTTP fetcher
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

export function UsersView() {
  // Server result renders first; later revalidations use `fetcher`.
  const { data: users } = useSWR("/api/users", fetcher);
  const { data: teams } = useSWR("/api/teams", fetcher);
  return <>{/* … */}</>;
}
```

Notes:

- `preload(key, serverFetcher)` runs the **server** fetcher (DB call OK);
  `useSWR(key, clientFetcher)` runs the **client** fetcher (`fetch(url)`).
  Keys must match; fetchers intentionally differ.
- `cacheData` only works on `SWRConfig`, never passed directly to `useSWR`.
- `preload` serializes array/function keys automatically.
- To find missing prefetches during adoption, set
  `strictServerPrefetchWarning: true` on `SWRConfig` (dev warning when a key
  has no prefilled data).

## Shot 4: Reusable hook + mutation (optimistic update)

```tsx
// hooks/use-user.ts
"use client";

import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";

export function useUser(id: string) {
  const { data, error, isLoading, mutate } = useSWR(`/api/user/${id}`, fetcher);
  return { user: data, isLoading, isError: error, mutate };
}
```

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

Pair the client `mutate` with a Server Action that invalidates the tagged
server cache (`updateTag`) so the next server read is fresh. Keep the SWR key
and the cache tag in the same `*-cache.ts` contract:

```ts
// activity-cache.ts
export const activityCache = {
  key: "/api/activity/unread",
  tag: (userId: string) => `activity:${userId}`,
};
```

## Shot 5: Complex (array) keys

```tsx
// Server seed: serialize the key manually.
import { unstable_serialize } from "swr";

const fallback = {
  [unstable_serialize(["api", "article", 1])]: article,
};

// Client read: same array key, no manual serialization needed.
("use client");
import useSWR from "swr";
import { fetcher } from "@repo/ui/lib/fetcher";
const { data } = useSWR(["api", "article", 1], fetcher);
```

(`preload` in Shot 3 does this serialization for you.)

## Shot 6 (future): access token

Nothing to do until the apps gain login — the seam is ready. When auth
lands, each app supplies a token source and every `useSWR` hook sends it
automatically. No per-hook changes needed.

```ts
// apps/<admin|dashboard>/lib/auth.ts — owned by the app, NOT shared.
// Back this with your real auth provider (in-memory token + httpOnly-cookie
// refresh is the usual shape). Must be a stable module-level function:
// an inline arrow would defeat the provider's `useMemo` and re-create the
// fetcher on every render.
export async function getAccessToken(): Promise<string | null> {
  return null; // TODO(auth): return the current access token
}
```

```tsx
// apps/<admin|dashboard>/app/layout.tsx — the only wiring change
<SWRProvider getAccessToken={getAccessToken}>{children}</SWRProvider>
```

Rules for the auth implementation:

- **Never** put tokens in SWR keys, `fallback`/`cacheData`, or URLs —
  keys end up in logs and caches. The `Authorization` header (set inside
  `createFetcher`) is the only place.
- **Never** expose refresh secrets to the client. Token refresh must go
  through an httpOnly-cookie endpoint; the client only ever holds the
  short-lived access token in memory.
- A `401` surfaces as the `error` of `useSWR` — handle it in the view
  (redirect to login / trigger refresh + `mutate`), not in the fetcher.
- Server prefetchers (`preload` functions, `fallback` promises) don't need
  the token: they run on the server and hit the DB directly, or the Route
  Handler validates the session cookie itself.
- Cookie-session alternative: if the API uses httpOnly cookies instead of
  Bearer tokens, skip `getAccessToken` entirely — same-origin `fetch`
  already sends cookies; only add `credentials: "include"` for
  cross-origin API calls.

## Agent checklist (before finishing)

- [ ] Hook file starts with `"use client"`; server files never import
      `useSWR` / `useSWRMutation` / `useSWRConfig`.
- [ ] One `*-cache.ts` key contract per feature, imported by both sides.
- [ ] Route-scoped `<SWRConfig fallback|cacheData>`; global provider stays
      fetcher-only.
- [ ] `pnpm lint --filter=<admin|dashboard>`, `check-types`, `build` pass.
