const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const existing = requestCounts.get(key);
  if (!existing || now > existing.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}
