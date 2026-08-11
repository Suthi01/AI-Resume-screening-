
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validateRequest';
import { ResumeRepository } from '../repositories/ResumeRepository';
import { getDatabase } from '../config/database';
import { SearchService } from '../services/SearchService';
import { EmbeddingService } from '../services/EmbeddingService';
import { LLMService } from '../services/LLMService';
import { config } from '../config';

const router = Router();

// Lazy initialization of services so we don't throw on route load if DB isn't connected yet
let resumeRepository: ResumeRepository;
let searchService: SearchService;

function getResumeRepository() {
  if (!resumeRepository) {
    const db = getDatabase();
    resumeRepository = new ResumeRepository(db);
  }
  return resumeRepository;
}

function getSearchService() {
  if (!searchService) {
    const repo = getResumeRepository();
    const embedService = new EmbeddingService(config);
    const llmService = getLLMService();
    searchService = new SearchService(repo, embedService, llmService);
  }
  return searchService;
}

let llmService: LLMService;

function getLLMService() {
  if (!llmService) {
    llmService = new LLMService(config);
  }
  return llmService;
}

// ─── Shared Validation Schema ────────────────────────────────────

const searchSchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(100).optional().default(20),
  filters: z.object({
    minYearsExperience: z.number().optional(),
    maxYearsExperience: z.number().optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
});

const rerankSchema = z.object({
  query: z.string().min(1).max(2000),
  candidates: z.array(z.object({
    resumeId: z.string(),
    snippet: z.string(),
  })).min(1).max(100),
  topK: z.number().int().min(1).max(100).optional().default(10),
});

const summarizeSchema = z.object({
  query: z.string().min(1).max(2000),
  candidate: z.object({
    resumeId: z.string(),
    snippet: z.string(),
  }),
  style: z.string().trim().toLowerCase().pipe(z.enum(['short', 'detailed'])).optional(),
  maxTokens: z.number().int().min(10).max(1000).optional(),
});

const endToEndSearchSchema = searchSchema.extend({
  summarize: z.boolean().optional().default(false),
  summaryStyle: z.string().trim().toLowerCase().pipe(z.enum(['short', 'detailed'])).optional(),
  summaryMaxTokens: z.number().int().min(10).max(1000).optional(),
  rerankTopN: z.number().int().min(1).max(50).optional().default(10),
});


/**
 * Perform a full-text search using Atlas Search (BM25)
 */
router.post(
  '/bm25',
  validateBody(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, topK, filters } = req.body;
      const svc = getSearchService();

      const response = await svc.bm25Search(query, filters, topK);

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/search/vector ──────────────────────────────────────

/**
 * Perform a vector search using Atlas Vector Search
 */
router.post(
  '/vector',
  validateBody(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, topK, filters } = req.body;
      const svc = getSearchService();

      const response = await svc.vectorSearch(query, filters, topK);

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/search/hybrid ──────────────────────────────────────

/**
 * Perform a hybrid search executing BM25 and Vector search in parallel,
 * returning both lists of results for debugging / comparison.
 */
router.post(
  '/hybrid',
  validateBody(searchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, topK, filters } = req.body;
      const svc = getSearchService();

      const response = await svc.hybridSearch(query, filters, topK);

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/search/rerank ──────────────────────────────────────

/**
 * Perform LLM re-ranking on a list of candidates
 */
router.post(
  '/rerank',
  validateBody(rerankSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, topK } = req.body;
      // Truncate snippets to 500 chars so the LLM prompt stays manageable
      const candidates: { resumeId: string; snippet: string }[] = req.body.candidates.map(
        (c: { resumeId: string; snippet: string }) => ({
          resumeId: c.resumeId,
          snippet: c.snippet.slice(0, 500),
        })
      );
      const llmService = getLLMService();

      const results = await llmService.rerankCandidates(query, candidates, topK);

      res.status(200).json({
        results,
        total: results.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/search/summarize ───────────────────────────────────

/**
 * Perform LLM summarization on a candidate's fit for the query
 */
router.post(
  '/summarize',
  validateBody(summarizeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, candidate, style, maxTokens } = req.body;
      const llmService = getLLMService();

      const startTime = performance.now();
      const summary = await llmService.summarizeCandidateFit(query, candidate, { style, maxTokens });
      const durationMs = Math.round(performance.now() - startTime);

      res.status(200).json({
        summary,
        durationMs,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/search ─────────────────────────────────────────────

/**
 * End-to-End Orchestrated Search Pipeline
 */
router.post(
  '/',
  validateBody(endToEndSearchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestPayload = req.body;
      const svc = getSearchService();

      const response = await svc.endToEndSearch(requestPayload);

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as searchRoutes };
