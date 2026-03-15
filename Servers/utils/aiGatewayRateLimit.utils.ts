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
  keyId: number | string,
  rpm: number
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const key = `gw:rate:${keyId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  const memberId = `${now}:${Math.random().toString(36).slice(2)}`;

  const pipeline = redisClient.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);   // [0] remove expired
  pipeline.zadd(key, now.toString(), memberId);       // [1] add this request
  pipeline.zcard(key);                                // [2] count AFTER add
  pipeline.expire(key, WINDOW_SECONDS);               // [3] set TTL

  const results = await pipeline.exec();
  const postAddCount = (results?.[2]?.[1] as number) || 0;

  if (postAddCount > rpm) {
    // Over limit — remove the entry we just added
    await redisClient.zrem(key, memberId);
    return {
      allowed: false,
      remaining: 0,
      resetMs: WINDOW_SECONDS * 1000,
    };
  }

  return {
    allowed: true,
    remaining: rpm - postAddCount,
    resetMs: WINDOW_SECONDS * 1000,
  };
}
