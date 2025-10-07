// Suppress identical POSTs for a short TTL window.
// Key: any stable string (e.g., `submit:<studentId>:<lessonId>`).
const inflight = new Map(); // key -> { promise, timer }

export function postOnce(key, factory, ttlMs = 1500) {
  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = Promise.resolve().then(factory).finally(() => {
    const rec = inflight.get(key);
    if (rec && rec.promise === promise) {
      rec.timer = setTimeout(() => inflight.delete(key), ttlMs);
    }
  });

  inflight.set(key, { promise, timer: null });
  return promise;
}
