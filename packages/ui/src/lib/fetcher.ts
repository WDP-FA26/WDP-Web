/**
 * Default SWR fetcher (official SWR guide: REST + JSON).
 *
 * SWR calls this with the `key` as the first arg, so keep the signature
 * `(url: string) => Promise<T>`. It throws on non-2xx so `useSWR` populates
 * `error` instead of resolving with an error page body.
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return parseJsonResponse<T>(url, res);
}

/**
 * Sync or async access-token source (e.g. in-memory token from your auth
 * provider, refreshed via an httpOnly-cookie refresh endpoint).
 * May be async so token refresh can happen lazily on first use.
 */
export type AccessTokenProvider = () => string | null | Promise<string | null>;

/**
 * Auth-ready fetcher factory for when the apps gain login.
 * Returns a `(url) => Promise<T>` fetcher that attaches
 * `Authorization: Bearer <token>` when the provider yields a token.
 * With no provider (or a null token) it behaves exactly like `fetcher`.
 *
 * Wire it via `<SWRProvider getAccessToken={...}>` so every `useSWR` hook
 * in the app picks it up — don't thread tokens through individual hooks.
 */
export function createFetcher(getAccessToken?: AccessTokenProvider) {
  return async function authenticatedFetcher<T>(url: string): Promise<T> {
    const token = await getAccessToken?.();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return parseJsonResponse<T>(url, res);
  };
}

async function parseJsonResponse<T>(url: string, res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
