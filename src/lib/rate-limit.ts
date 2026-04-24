const store = new Map<string, number[]>();
const WINDOW_MS = 60_000;

// Returns true if the request is within the allowed rate, false if it exceeds it.
export function rateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) return false;
  hits.push(now);
  store.set(key, hits);
  return true;
}
