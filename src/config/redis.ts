import Redis from 'ioredis';
import { env } from '@/config/env';

// A single shared Redis client for the entire application.
// Using a singleton avoids creating multiple connections and exhausting
// the Redis server's connection limit.
const redis = new Redis(env.REDIS_URL, {
  // Don't connect automatically on import — we call redis.connect()
  // explicitly in server.ts after the env has been validated.
  lazyConnect: true,

  // Automatically retry on disconnection with exponential backoff,
  // capped at 3 s, up to 10 retries.
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 10) {
      console.error('[redis] Max reconnection attempts reached. Giving up.');
      return null; // stop retrying
    }
    return Math.min(times * 100, 3_000); // exponential backoff up to 3 s
  },
});

redis.on('connect', () => {
  console.info('[redis] Connected successfully');
});

redis.on('ready', () => {
  console.info('[redis] Client ready to receive commands');
});

redis.on('error', (err: Error) => {
  console.error('[redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.warn('[redis] Connection closed');
});

export default redis;
