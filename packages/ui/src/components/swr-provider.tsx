"use client";

import { useMemo, type ReactNode } from "react";
import { SWRConfig } from "swr";
import {
  createFetcher,
  fetcher,
  type AccessTokenProvider,
} from "../lib/fetcher";

/**
 * Global SWR provider (App Router).
 *
 * - Must be a Client Component (`"use client"`): `SWRConfig` configures
 *   client-side hooks, while pages/layouts stay Server Components by default.
 * - Only sets the shared `fetcher`. Feature data (`fallback` / `cacheData`)
 *   belongs in a route-scoped nested `<SWRConfig>` (see `docs/swr.md`),
 *   not here, so one route's cache seed never leaks into another.
 * - Code is shared via `@repo/ui`, but each app renders its own instance,
 *   so SWR caches stay per-app runtime state.
 * - Auth (future): pass a stable module-level `getAccessToken` and every
 *   `useSWR` hook sends `Authorization: Bearer <token>`. Omit it and the
 *   provider behaves exactly like the plain `fetcher`.
 */
export function SWRProvider({
  children,
  getAccessToken,
}: {
  children: ReactNode;
  getAccessToken?: AccessTokenProvider;
}) {
  const value = useMemo(
    () => ({
      fetcher: getAccessToken ? createFetcher(getAccessToken) : fetcher,
    }),
    [getAccessToken],
  );
  return <SWRConfig value={value}>{children}</SWRConfig>;
}
