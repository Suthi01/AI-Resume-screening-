import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { embeddingRoutes } from './embedding.routes';
import { searchRoutes } from './search.routes';
import ingestionRoutes from './ingestionRoutes';
import { candidateRoutes } from './candidate.routes';

/**
 * Aggregates all route modules under the /v1 prefix.
 */
const router = Router();

// Health endpoints
router.use('/', healthRoutes);

// Embedding endpoints
router.use('/embeddings', embeddingRoutes);

// Search endpoints
router.use('/search', searchRoutes);

// Candidate profile endpoint
router.use('/candidate', candidateRoutes);

// Ingestion endpoints (resume upload, extract, etc.)
router.use('/', ingestionRoutes);

export { router as routes };
