import http from 'http';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/database/connection';
import redis from '@/config/redis';

const app = createApp();
const server = http.createServer(app);

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
// Closes the HTTP server, MongoDB connection, and Redis client cleanly.
// Essential for zero-downtime deployments in Docker / Kubernetes.
function gracefulShutdown(signal: string): void {
  console.info(`\n[server] Received ${signal}. Shutting down gracefully…`);

  // Force-kill if the full shutdown takes longer than 10 s.
  const killTimer = setTimeout(() => {
    console.error('[server] Shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10_000);

  // Don't keep the process alive just for the timer.
  killTimer.unref();

  server.close((err) => {
    if (err) {
      console.error('[server] Error closing HTTP server:', err);
      process.exit(1);
    }

    // Close DB + Redis after HTTP server stops accepting new connections.
    Promise.all([disconnectDatabase(), redis.quit()])
      .then(() => {
        console.info('[server] All connections closed. Process exiting.');
        process.exit(0);
      })
      .catch((closeErr: unknown) => {
        console.error('[server] Error during connection teardown:', closeErr);
        process.exit(1);
      });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled Errors ───────────────────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[server] Unhandled promise rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err: Error) => {
  console.error('[server] Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

// ─── Bootstrap ──────────────────────────────────────────────────────────────
// Connect to MongoDB and Redis before opening the HTTP port.
// If either connection fails, the error propagates to unhandledRejection above.
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await redis.connect();

  server.listen(env.PORT, () => {
    console.info(`[server] TeamFlow AI API running on port ${env.PORT} (${env.NODE_ENV})`);
    console.info(`[server] Health: http://localhost:${env.PORT}/health`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

export default server;
