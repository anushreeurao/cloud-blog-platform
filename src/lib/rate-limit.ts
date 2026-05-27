const windowMs = 60_000;
const maxRequests = 30;

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { success: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { success: true, remaining: Math.max(0, maxRequests - bucket.count) };
}
