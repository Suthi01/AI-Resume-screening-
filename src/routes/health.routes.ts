import { Router, Request, Response } from 'express';
import { getDatabase, getClient } from '../config/database';
import { logger } from '../services/LoggingService';
import { config } from '../config';

const router = Router();

// ─── GET /v1/health ──────────────────────────────────────────────

/**
 * Application-level health check.
 * Returns service name, version, uptime, and current timestamp.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'resume-ai-rag',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── GET /v1/health/db ───────────────────────────────────────────

/**
 * MongoDB connectivity health check.
 * Pings the database and reports latency.
 */
router.get('/health/db', async (req: Request, res: Response) => {
  const startTime = performance.now();

  try {
    const db = getDatabase();
    const client = getClient();

    // Admin ping to verify connectivity
    await db.command({ ping: 1 });

    const latencyMs = Math.round(performance.now() - startTime);

    // Fetch server status for additional diagnostics
    const serverInfo = await client.db('admin').command({ serverStatus: 1 });

    res.status(200).json({
      status: 'connected',
      latencyMs,
      database: db.databaseName,
      serverVersion: serverInfo.version,
      connections: {
        current: serverInfo.connections?.current,
        available: serverInfo.connections?.available,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);

    logger.error(
      { requestId: req.requestId, err, latencyMs },
      'MongoDB health check failed'
    );

    res.status(503).json({
      status: 'disconnected',
      latencyMs,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── GET /v1/health/db/diagnose ──────────────────────────────────

/**
 * Deep diagnostic: confirms collection access, document count,
 * sample field names, and lists all Atlas Search indexes.
 * Use this to debug BM25 / vector search issues.
 */
router.get('/health/db/diagnose', async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const collection = db.collection(config.mongodbCollection);

    // 1. Count documents in the target collection
    const docCount = await collection.countDocuments();

    // 2. Grab one document to inspect field names AND experience field type
    const sampleDoc = await collection.findOne({});
    const sampleFields = sampleDoc ? Object.keys(sampleDoc) : [];
    const sampleExperience = sampleDoc ? sampleDoc.totalExperience : undefined;
    const sampleExperienceType = sampleDoc ? typeof sampleDoc.totalExperience : 'field missing';

    // 3. Check if any documents have the `text` field (needed for BM25)
    const withTextField = await collection.countDocuments({ text: { $exists: true } });

    // 4. Count docs where totalExperience >= 1 (as number AND as string) to detect type mismatch
    const expAsNumber = await collection.countDocuments({ totalExperience: { $gte: 1 } });
    const expAsString = await collection.countDocuments({ totalExperience: { $gte: '1' } });
    const expViaExpr = await collection.countDocuments({
      $expr: { $gte: [{ $toDouble: '$totalExperience' }, 1] }
    });

    // 5. List Atlas Search indexes on this collection
    let searchIndexes: any[] = [];
    let searchIndexError: string | null = null;
    try {
      const cursor = (collection as any).listSearchIndexes();
      searchIndexes = await cursor.toArray();
    } catch (idxErr: any) {
      searchIndexError = idxErr?.message ?? 'Could not list search indexes';
    }

    res.status(200).json({
      database: config.mongodbDbName,
      collection: config.mongodbCollection,
      configuredBm25Index: config.mongodbBm25IndexName,
      configuredVectorIndex: config.mongodbVectorIndexName,
      documentCount: docCount,
      documentsWithTextField: withTextField,
      sampleDocumentFields: sampleFields,
      experienceDiagnostics: {
        sampleValue: sampleExperience,
        storedType: sampleExperienceType,
        docsWithExpGte1AsNumber: expAsNumber,
        docsWithExpGte1AsString: expAsString,
        docsWithExpGte1ViaToDouble: expViaExpr,
      },
      atlasSearchIndexes: searchIndexes.map(idx => ({
        name: idx.name,
        status: idx.status,
        type: idx.type,
      })),
      atlasSearchIndexError: searchIndexError,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error({ err }, 'Diagnose endpoint failed');
    res.status(500).json({
      error: err?.message ?? 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRoutes };
