import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // Server
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
  API_VERSION: optionalEnv('API_VERSION', 'v1'),

  // CORS
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:3000'),

  // Database
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // Redis
  REDIS_URL: optionalEnv('REDIS_URL', 'redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Email
  SMTP_HOST: optionalEnv('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
  SMTP_USER: optionalEnv('SMTP_USER', ''),
  SMTP_PASS: optionalEnv('SMTP_PASS', ''),
  EMAIL_FROM: optionalEnv('EMAIL_FROM', 'noreply@teamflow.ai'),

  // OAuth
  GOOGLE_CLIENT_ID: optionalEnv('GOOGLE_CLIENT_ID', ''),
  GOOGLE_CLIENT_SECRET: optionalEnv('GOOGLE_CLIENT_SECRET', ''),
  GITHUB_CLIENT_ID: optionalEnv('GITHUB_CLIENT_ID', ''),
  GITHUB_CLIENT_SECRET: optionalEnv('GITHUB_CLIENT_SECRET', ''),

  // App
  APP_URL: optionalEnv('APP_URL', 'http://localhost:5000'),

  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },

  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },
} as const;
