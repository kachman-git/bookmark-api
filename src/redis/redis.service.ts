// redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis.Redis;

  async onModuleInit() {
    this.client = new Redis.default(
      process.env.REDIS_URL || 'redis://localhost:6379',
    );
    this.client.on('error', (err) => console.error('Redis error:', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Sets a key in Redis with an optional TTL.
   * @param key - The key to set.
   * @param value - The value to set.
   * @param ttlSeconds - Time to live in seconds (optional).
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Retrieves a value from Redis by key.
   * @param key - The key to retrieve.
   * @returns The stored value or null if not found.
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Deletes a key from Redis.
   * @param key - The key to delete.
   * @returns The number of keys that were removed.
   */
  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }
}
