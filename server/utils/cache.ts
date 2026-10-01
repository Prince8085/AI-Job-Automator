/**
 * Cache Service
 * High-performance in-memory and Redis-based caching
 */

import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalSize: number;
}

/**
 * In-Memory Cache Implementation
 */
class InMemoryCache {
  private cache = new Map<
    string,
    { value: any; expiresAt: number | null }
  >();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    totalSize: 0,
  };

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
    });

    this.stats.sets++;
    this.updateSize();

    logger.debug('Cache set', {
      key,
      ttl: ttl ? `${ttl}ms` : 'never',
      action: 'cache.set',
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateSize();
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalSize: 0,
    };
    logger.info('Cache cleared', { action: 'cache.clear' });
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!entry.expiresAt || Date.now() <= entry.expiresAt) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate =
      total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      totalSize: 0,
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.stats.deletes += cleaned;
        this.updateSize();
        logger.debug('Cache cleanup', {
          keysRemoved: cleaned,
          action: 'cache.cleanup',
        });
      }
    }, 60000); // Run every 60 seconds
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Update total cache size
   */
  private updateSize(): void {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.value).length;
    }
    this.stats.totalSize = size;
  }
}

/**
 * Pattern-based cache manager
 */
class CacheManager {
  private cache: InMemoryCache;

  constructor() {
    this.cache = new InMemoryCache();
  }

  /**
   * Get with pattern matching
   */
  getByPattern<T>(pattern: string): Map<string, T> {
    const results = new Map<string, T>();
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);

    for (const key of keys) {
      if (regex.test(key)) {
        const value = this.cache.get<T>(key);
        if (value !== null) {
          results.set(key, value);
        }
      }
    }

    return results;
  }

  /**
   * Delete by pattern
   */
  deleteByPattern(pattern: string): number {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of keys) {
      if (regex.test(key)) {
        if (this.cache.delete(key)) {
          deleted++;
        }
      }
    }

    logger.info('Cache pattern delete', {
      pattern,
      keysDeleted: deleted,
      action: 'cache.deleteByPattern',
    });

    return deleted;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    let value = this.cache.get<T>(key);

    if (value !== null) {
      logger.debug('Cache hit for key', { key, action: 'cache.getOrSet' });
      return value;
    }

    logger.debug('Cache miss for key, fetching', {
      key,
      action: 'cache.getOrSet',
    });

    value = await fetcher();
    this.cache.set(key, value, ttl);

    return value;
  }

  /**
   * Invalidate cache for resource
   */
  invalidateResource(resourceType: string, resourceId?: string): number {
    let pattern: string;

    if (resourceId) {
      pattern = `${resourceType}:${resourceId}:.*`;
    } else {
      pattern = `${resourceType}:.*`;
    }

    return this.deleteByPattern(pattern);
  }

  // Direct cache access
  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number) {
    return this.cache.set(key, value, ttl);
  }

  delete(key: string) {
    return this.cache.delete(key);
  }

  has(key: string) {
    return this.cache.has(key);
  }

  clear() {
    return this.cache.clear();
  }

  keys() {
    return this.cache.keys();
  }

  getStats() {
    return this.cache.getStats();
  }

  resetStats() {
    return this.cache.resetStats();
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

export default cacheManager;
