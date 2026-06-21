/**
 * In-memory rate limiter for Next.js API routes.
 *
 * Uses a sliding window approach keyed by IP address or user ID.
 * For production, replace with Redis-backed limiter (e.g., Upstash ratelimit).
 *
 * Usage:
 *   const result = rateLimit({ key: ip, limit: 10, windowMs: 60_000 });
 *   if (!result.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

// In-memory store (resets on server restart)
const store: RateLimitStore = {};

export interface RateLimitOptions {
  /** Unique key (IP address or user ID) */
  key: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a key is within rate limits.
 * Increments the counter on each call.
 */
export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const k in store) {
      if (store[k].resetAt < now) delete store[k];
    }
  }

  const entry = store[key];

  if (!entry || entry.resetAt < now) {
    // New window
    store[key] = { count: 1, resetAt: now + windowMs };
    return { success: true, remaining: limit - 1, resetAt: store[key].resetAt };
  }

  entry.count++;

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** 10 requests per minute (for auth endpoints) */
export function authRateLimit(key: string) {
  return rateLimit({ key, limit: 10, windowMs: 60_000 });
}

/** 30 requests per minute (for general API endpoints) */
export function apiRateLimit(key: string) {
  return rateLimit({ key, limit: 30, windowMs: 60_000 });
}

/** 5 requests per hour (for expensive operations like draw simulation) */
export function heavyRateLimit(key: string) {
  return rateLimit({ key, limit: 5, windowMs: 3_600_000 });
}

/** 3 requests per 10 minutes (for proof submission) */
export function proofRateLimit(key: string) {
  return rateLimit({ key, limit: 3, windowMs: 600_000 });
}

/**
 * Helper: extract IP from NextRequest headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
