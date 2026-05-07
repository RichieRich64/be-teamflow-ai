import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from '@/config/env';

export function createApp(): Application {
  const app = express();

  // ─── Security Headers ─────────────────────────────────────────────────────
  // helmet sets a collection of security-related HTTP headers automatically,
  // protecting against clickjacking, MIME-type sniffing, XSS, and more.
  app.use(helmet());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // Only allow requests from the configured client origin. credentials: true
  // is required so the browser sends httpOnly cookies (used for refresh tokens).
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ─── Compression ──────────────────────────────────────────────────────────
  // gzip all responses above 1KB — critical for large JSON payloads.
  app.use(compression());

  // ─── Request Logging ──────────────────────────────────────────────────────
  // 'dev' format: colourised output showing method, path, status, and latency.
  // Skip logging in test environment to keep test output clean.
  if (!env.isTest) {
    app.use(morgan('dev'));
  }

  // ─── Body Parsers ─────────────────────────────────────────────────────────
  // Limit payload size to prevent large-body DoS attacks.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Health Check ─────────────────────────────────────────────────────────
  // Simple liveness probe for load balancers / container orchestrators.
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Routes ───────────────────────────────────────────────────────────
  // Feature routes will be mounted here as they are built, e.g.:
  // app.use(`/api/${env.API_VERSION}/auth`, authRouter);
  // app.use(`/api/${env.API_VERSION}/users`, usersRouter);

  // ─── 404 Handler ──────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // ─── Global Error Handler ─────────────────────────────────────────────────
  // The signature (err, req, res, next) with 4 params is how Express identifies
  // an error-handling middleware. Must be registered last.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: env.isProduction ? 'Internal server error' : err.message,
    });
  });

  return app;
}
