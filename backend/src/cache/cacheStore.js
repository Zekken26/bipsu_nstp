import { getTtlForKey } from './ttlPolicies.js';

const store = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}, 10_000).unref();

export async function getCached(cacheKey) {
  const hit = store.get(cacheKey);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    store.delete(cacheKey);
    return null;
  }
  return hit.value;
}

export async function setCached(cacheKey, value, ttlSeconds = getTtlForKey(cacheKey)) {
  store.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateKeys(prefixes) {
  for (const key of store.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      store.delete(key);
    }
  }
}
