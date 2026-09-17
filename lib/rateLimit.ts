// In-memory rate limiting for the mobile bridge routes (app/api/mobile/**).
// Resets on cold start/redeploy and isn't shared across concurrent serverless
// instances — an accepted trade-off at capstone scale, where the goal is
// abuse deterrence, not a precise global quota. Upstash Redis is the natural
// upgrade path if this ever needs to survive across instances.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

/**
 * Sliding-window-ish fixed-window limiter: `key` gets `limit` requests per
 * `windowMs`, then is rejected until the window resets.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count }
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
