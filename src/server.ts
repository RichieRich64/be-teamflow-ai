import http from 'http';
import { createApp } from '@/app';
import { env } from '@/config/env';

const app = createApp();
const server = http.createServer(app);

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
// Allows in-flight requests to complete before the process exits.
// Essential for zero-downtime deployments in Docker / Kubernetes.
function gracefulShutdown(signal: string): void {
  console.info(`\n[server] Received ${signal}. Shutting down gracefully…`);

  server.close((err) => {
    if (err) {
      console.error('[server] Error during shutdown:', err);
      process.exit(1);
    }

    console.info('[server] All connections closed. Process exiting.');
    process.exit(0);
  });

  // Force-kill if shutdown takes longer than 10 s (e.g. hung DB connections).
  setTimeout(() => {
    console.error('[server] Shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled Errors ───────────────────────────────────────────────────────
// Catch async errors that escaped without a .catch() — log and shut down.
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[server] Unhandled promise rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

// Catch synchronous throws that escaped the process — log and shut down.
process.on('uncaughtException', (err: Error) => {
  console.error('[server] Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

// ─── Start Server ───────────────────────────────────────────────────────────
server.listen(env.PORT, () => {
  console.info(`[server] TeamFlow AI API running on port ${env.PORT} (${env.NODE_ENV})`);
  console.info(`[server] Health: http://localhost:${env.PORT}/health`);
});

export default server;
