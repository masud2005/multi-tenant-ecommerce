import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6380);

    try {
      this.redisClient = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 300, 2000);
        },
      });

      this.redisClient.on('connect', () => {
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });

      this.redisClient.on('error', (err) => {
        this.logger.warn(`Redis notice (${host}:${port}): ${err.message}`);
      });

      this.redisClient.connect().catch((err) => {
        this.logger.warn(`Redis offline at ${host}:${port}: continuing without cache (${err.message})`);
      });
    } catch (err: any) {
      this.logger.warn(`Redis init warning: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient && this.redisClient.status === 'ready') {
        await this.redisClient.quit();
      }
    } catch {
      // Ignore disconnect errors
    }
  }

  get client(): Redis {
    return this.redisClient;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.redisClient || this.redisClient.status !== 'ready') return;
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch {
      // Graceful fallback when Redis is offline
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.redisClient || this.redisClient.status !== 'ready') return null;
      return await this.redisClient.get(key);
    } catch {
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.redisClient || this.redisClient.status !== 'ready') return;
      await this.redisClient.del(key);
    } catch {
      // Graceful fallback
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.redisClient || this.redisClient.status !== 'ready') return 0;
      return await this.redisClient.incr(key);
    } catch {
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      if (!this.redisClient || this.redisClient.status !== 'ready') return 0;
      return await this.redisClient.expire(key, seconds);
    } catch {
      return 0;
    }
  }
}
