import redisClient from "../../database/redis";

/**
 * Redis Cache Service
 *
 * Wrapper around the existing Redis client with type-safe operations,
 * error handling, and graceful degradation if Redis is unavailable.
 */

/**
 * Get a value from Redis cache
 *
 * @param key - The cache key
 * @returns The cached value or null if not found or error
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[REDIS CACHE] Error getting key "${key}":`, error);
    return null; // Graceful degradation - return null on error
  }
}

/**
 * Set a value in Redis cache with TTL
 *
 * @param key - The cache key
 * @param value - The value to cache
 * @param ttlSeconds - Time to live in seconds (default: 900 = 15 minutes)
 * @returns True if successful, false otherwise
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = 900 // 15 minutes default
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error(`[REDIS CACHE] Error setting key "${key}":`, error);
    return false; // Graceful degradation - return false on error
  }
}

/**
 * Delete a single key from Redis cache
 *
 * @param key - The cache key to delete
 * @returns True if successful, false otherwise
 */
export async function del(key: string): Promise<boolean> {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`[REDIS CACHE] Error deleting key "${key}":`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 *
 * @param pattern - The pattern to match (e.g., "analytics:tenant123:*")
 * @returns Number of keys deleted
 */
export async function delPattern(pattern: string): Promise<number> {
  try {
    // Use SCAN to find matching keys (more efficient than KEYS)
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, matchingKeys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...matchingKeys);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return 0;
    }

    // Delete all matching keys
    await redisClient.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`[REDIS CACHE] Error deleting pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Check if Redis is available
 *
 * @returns True if Redis is connected and responding, false otherwise
 */
export async function isAvailable(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('[REDIS CACHE] Redis is not available:', error);
    return false;
  }
}

/**
 * Get cache statistics for monitoring
 *
 * @returns Basic Redis info or null if unavailable
 */
export async function getStats(): Promise<{
  connected: boolean;
  keysCount?: number;
  memoryUsed?: string;
} | null> {
  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbsize();

    return {
      connected: true,
      keysCount: dbSize,
      memoryUsed: extractMemoryUsage(info)
    };
  } catch (error) {
    console.error('[REDIS CACHE] Error getting stats:', error);
    return { connected: false };
  }
}

/**
 * Helper to extract memory usage from Redis INFO output
 */
function extractMemoryUsage(info: string): string {
  const match = info.match(/used_memory_human:([^\r\n]+)/);
  return match ? match[1] : 'unknown';
}
