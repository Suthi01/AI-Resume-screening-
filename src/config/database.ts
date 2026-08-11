import { MongoClient, Db } from 'mongodb';
import { config } from '../config';
import { logger } from '../services/LoggingService';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Establishes and caches the MongoDB connection.
 * Uses the native MongoDB driver (not Mongoose) for full aggregation pipeline support.
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const startTime = performance.now();

  try {
    client = new MongoClient(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      retryWrites: true,
      retryReads: true,
    });

    await client.connect();
    db = client.db(config.mongodbDbName);

    // Verify connectivity with a ping
    await db.command({ ping: 1 });

    const durationMs = Math.round(performance.now() - startTime);
    logger.info(
      { database: config.mongodbDbName, durationMs },
      `MongoDB connected to "${config.mongodbDbName}" in ${durationMs}ms`
    );

    return db;
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    throw err;
  }
}

/**
 * Returns the cached database instance.
 * Throws if `connectToDatabase()` has not been called.
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialised. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Returns the cached MongoClient for health checks.
 */
export function getClient(): MongoClient {
  if (!client) {
    throw new Error('MongoClient not initialised. Call connectToDatabase() first.');
  }
  return client;
}

/**
 * Gracefully closes the MongoDB connection.
 */
export async function disconnectDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}
