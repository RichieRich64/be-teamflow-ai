import mongoose from 'mongoose';
import { env } from '@/config/env';

// Mongoose emits these events on the default connection.
// Wiring them up here gives us clear console visibility during dev and in logs.
mongoose.connection.on('connected', () => {
  console.info('[database] MongoDB connected successfully');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[database] MongoDB disconnected');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('[database] MongoDB connection error:', err.message);
});

/**
 * Opens the Mongoose connection to MongoDB Atlas (or local).
 * Call this once in server.ts before server.listen().
 *
 * Mongoose manages an internal connection pool, so this single call
 * is sufficient for the lifetime of the process.
 */
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    // These options ensure Mongoose selects the correct DNS-resolved server
    // and avoids deprecated connection behaviour.
    serverSelectionTimeoutMS: 5_000, // fail fast if Atlas is unreachable
    socketTimeoutMS: 45_000, // close sockets after 45 s of inactivity
  });
}

/**
 * Closes the Mongoose connection gracefully.
 * Called during SIGTERM / SIGINT shutdown to avoid hanging connections.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  console.info('[database] MongoDB connection closed');
}
