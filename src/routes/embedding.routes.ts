import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validateRequest';
import { SuccessResponse } from '../types/common.types';
import { EmbeddingService } from '../services/EmbeddingService';
import { config } from '../config';
import { EMBEDDING_INPUT_MAX_LENGTH } from '../config/constants';

const router = Router();
const embeddingService = new EmbeddingService(config);

// ─── POST /v1/embeddings ─────────────────────────────────────────

const embeddingSchema = z.object({
  model: z.string().optional(),
  input: z.string().min(1).max(EMBEDDING_INPUT_MAX_LENGTH),
});

/**
 * Generate an embedding for the given input text.
 */
router.post(
  '/',
  validateBody(embeddingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { model, input } = req.body;
      
      const response = await embeddingService.generateEmbedding(input, model);

      const successResponse: SuccessResponse<typeof response> = {
        status: 'ok',
        data: response,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(successResponse);
    } catch (err) {
      next(err); // Pass to global error handler
    }
  }
);

export { router as embeddingRoutes };
