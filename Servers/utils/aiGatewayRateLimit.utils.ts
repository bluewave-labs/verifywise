/**
 * AI Gateway Rate Limiting
 *
 * Redis sliding window rate limiter using sorted sets.
 * Checks requests-per-minute against the endpoint's rate_limit_rpm.
 */

import redisClient from "../database/redis";

const WINDOW_SECONDS = 60;

/**
 * Check if a request is allowed under the endpoint's RPM limit.
 * Uses a Redis sorted set with timestamps as scores.
 *
 * Returns { allowed, remaining, resetMs }
 */
export async function checkRateLimit(
  endpointId: number,
  rpm: number
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const key = `gw:rate:${endpointId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  const pipeline = redisClient.pipeline();
  // Remove expired entries
  pipeline.zremrangebyscore(key, 0, windowStart);
  // Count current window
  pipeline.zcard(key);
  // Add this request
  pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);
  // Set TTL
  pipeline.expire(key, WINDOW_SECONDS);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) || 0;

  if (currentCount >= rpm) {
    // Over limit — remove the entry we just added
    await redisClient.zremrangebyscore(key, now, now + 1);
    return {
      allowed: false,
      remaining: 0,
      resetMs: WINDOW_SECONDS * 1000,
    };
  }

  return {
    allowed: true,
    remaining: rpm - currentCount - 1,
    resetMs: WINDOW_SECONDS * 1000,
  };
}
