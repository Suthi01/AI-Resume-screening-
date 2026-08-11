import { ResumeRepository } from '../repositories/ResumeRepository';
import { EmbeddingService } from './EmbeddingService';
import { LLMService } from './LLMService';
import { 
  BM25SearchResponse, 
  SearchFilters, 
  VectorSearchResponse, 
  HybridSearchResponse,
  EndToEndSearchRequest,
  EndToEndSearchResponse,
  RankedResumeResult,
  CandidateSnippet
} from '../types/search.types';
import pino from 'pino';

const logger = pino();

export class SearchService {
  constructor(
    private resumeRepository: ResumeRepository,
    private embeddingService: EmbeddingService,
    private llmService: LLMService
  ) {}

  /**
   * Performs full-text BM25 search using MongoDB Atlas Search.
   * Delegates directly to the repository and wraps the call with timing.
   */
  async bm25Search(query: string, filters: SearchFilters = {}, topK: number = 20): Promise<BM25SearchResponse> {
    const startTime = performance.now();

    const rawResults = await this.resumeRepository.bm25Search(query, filters, topK);
    const results = rawResults.map(doc => ({
      ...doc,
      bm25Score: doc.score,
      sources: ['bm25'] as Array<'bm25' | 'vector' | 'hybrid'>,
    }));

    return {
      results,
      total: results.length,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Performs vector search: generates an embedding from the query and passes it to the repository.
   */
  async vectorSearch(query: string, filters: SearchFilters = {}, topK: number = 20): Promise<VectorSearchResponse> {
    const startTime = performance.now();
    
    // 1. Generate embedding
    const embedResult = await this.embeddingService.generateEmbedding(query);
    const embeddingMs = Math.round(performance.now() - startTime);

    // 2. Perform vector search in DB
    const searchStartTime = performance.now();
    const rawResults = await this.resumeRepository.vectorSearch(embedResult.embedding, filters, topK);
    const searchMs = Math.round(performance.now() - searchStartTime);

    const results = rawResults.map(doc => ({
      ...doc,
      vectorScore: doc.score,
      sources: ['vector'] as Array<'bm25' | 'vector' | 'hybrid'>,
    }));

    return {
      results,
      total: results.length,
      durationMs: embeddingMs + searchMs,
    };
  }

  /**
   * Runs BM25 search and Vector search in parallel.
   * Merges the results using Reciprocal Rank Fusion (RRF) with normalized scores (0-1).
   */
  async hybridSearch(query: string, filters: SearchFilters = {}, topK: number = 20): Promise<HybridSearchResponse> {
    const startTime = performance.now();

    const [bm25Response, vectorResponse] = await Promise.all([
      this.bm25Search(query, filters, topK),
      this.vectorSearch(query, filters, topK),
    ]);

    // Reciprocal Rank Fusion (RRF)
    const k = 60;
    const rrfScores = new Map<string, { score: number; doc: any }>();

    // Process BM25 results
    bm25Response.results.forEach((doc, index) => {
      if (!doc.resumeId) return;
      const rank = index + 1;
      const score = 1 / (k + rank);
      rrfScores.set(doc.resumeId, {
        score,
        doc: {
          ...doc,
          bm25Score: doc.score,
          sources: ['bm25'],
        },
      });
    });

    // Process Vector results
    vectorResponse.results.forEach((doc, index) => {
      if (!doc.resumeId) return;
      const rank = index + 1;
      const score = 1 / (k + rank);
      
      if (rrfScores.has(doc.resumeId)) {
        const existing = rrfScores.get(doc.resumeId)!;
        existing.score += score;
        existing.doc.vectorScore = doc.score;
        if (!existing.doc.sources.includes('vector')) {
          existing.doc.sources.push('vector');
        }
      } else {
        rrfScores.set(doc.resumeId, {
          score,
          doc: {
            ...doc,
            vectorScore: doc.score,
            sources: ['vector'],
          },
        });
      }
    });

    // Sort by RRF score descending
    let mergedResults = Array.from(rrfScores.values()).sort((a, b) => b.score - a.score);

    // Normalize scores (Max possible score is rank 1 in both: 2 / 61)
    const maxPossibleScore = 2 / (k + 1);
    const finalResults = mergedResults.map(item => {
      const normalizedScore = Math.min(item.score / maxPossibleScore, 1.0);
      return {
        ...item.doc,
        score: normalizedScore,
        searchType: 'hybrid',
      };
    }).slice(0, topK);

    return {
      results: finalResults,
      total: finalResults.length,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * End-to-End Orchestration: BM25 + Vector -> Merge (RRF) -> LLM Re-Rank -> (Optional) Summarize.
   */
  async endToEndSearch(request: EndToEndSearchRequest): Promise<EndToEndSearchResponse> {
    // startTime removed - not used
    const { query, filters = {}, topK = 10, summarize = false, summaryStyle = 'detailed', rerankTopN = 10 } = request;
    
    const componentTimings = {
      embeddingMs: 0,
      bm25Ms: 0,
      vectorMs: 0,
      rerankMs: 0,
      summarizeMs: 0,
    };

    const fallbacks = {
      vectorFallback: false,
      bm25Fallback: false,
      rerankFallback: false,
    };

    // --- PHASE 1: RETRIEVAL ---
    let bm25Results: any[] = [];
    let vectorResults: any[] = [];
    
    // Concurrently fetch BM25 and Vector search results
    // We catch errors per-engine to implement fallback logic
    const retrievalPromises = [
      this.bm25Search(query, filters, 100).then(res => {
        componentTimings.bm25Ms = res.durationMs;
        bm25Results = res.results;
      }).catch(err => {
        logger.error({ err }, 'BM25 search failed in E2E pipeline');
        fallbacks.bm25Fallback = true;
      }),
      this.vectorSearch(query, filters, 100).then(res => {
        componentTimings.vectorMs = res.durationMs;
        vectorResults = res.results;
      }).catch(err => {
        logger.error({ err }, 'Vector search failed in E2E pipeline');
        fallbacks.vectorFallback = true;
      })
    ];

    await Promise.all(retrievalPromises);

    // --- PHASE 2: MERGE & DEDUPLICATE (RRF) ---
    // Reciprocal Rank Fusion
    const k = 60;
    const rrfScores = new Map<string, { score: number; doc: any }>();

    bm25Results.forEach((doc, index) => {
      if (!doc.resumeId) return;
      const rank = index + 1;
      const score = 1 / (k + rank);
      rrfScores.set(doc.resumeId, { score, doc });
    });

    vectorResults.forEach((doc, index) => {
      if (!doc.resumeId) return;
      const rank = index + 1;
      const score = 1 / (k + rank);
      if (rrfScores.has(doc.resumeId)) {
        rrfScores.get(doc.resumeId)!.score += score;
      } else {
        rrfScores.set(doc.resumeId, { score, doc });
      }
    });

    // Sort descending by RRF score
    let mergedResults = Array.from(rrfScores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.doc);

    // Take top N for LLM re-ranking
    const candidatesToRerank = mergedResults.slice(0, rerankTopN);

    // --- PHASE 3: LLM RE-RANKING ---
    let finalRanked: RankedResumeResult[] = [];
    if (candidatesToRerank.length > 0) {
      try {
        const rerankStart = performance.now();
        // Prepare snippets
        const snippets: CandidateSnippet[] = candidatesToRerank.map(c => ({
          resumeId: c.resumeId,
          snippet: c.snippet || c.summary || ''
        }));
        
        // Let the LLM re-rank them
        const rerankedSnippets = await this.llmService.rerankCandidates(query, snippets, topK);
        componentTimings.rerankMs = Math.round(performance.now() - rerankStart);

        // Map the re-ranked snippets back to full documents
        const candidateMap = new Map<string, any>();
        candidatesToRerank.forEach(c => candidateMap.set(c.resumeId, c));

        rerankedSnippets.forEach((rs, index) => {
          const doc = candidateMap.get(rs.resumeId);
          if (doc) {
            finalRanked.push({ ...doc, rank: index + 1 });
          }
        });
      } catch (error) {
        logger.error({ err: error }, 'LLM re-ranking failed in E2E pipeline. Falling back to RRF.');
        fallbacks.rerankFallback = true;
        finalRanked = candidatesToRerank.slice(0, topK).map((doc, idx) => ({ ...doc, rank: idx + 1 }));
      }
    }

    // --- PHASE 4: SUMMARIZATION ---
    if (summarize && finalRanked.length > 0) {
      const summarizeStart = performance.now();
      
      const summarizePromises = finalRanked.map(async (candidate) => {
        const snippet: CandidateSnippet = {
          resumeId: candidate.resumeId,
          snippet: candidate.snippet || candidate.summary || ''
        };
        try {
          candidate.summary = await this.llmService.summarizeCandidateFit(query, snippet, { style: summaryStyle });
        } catch (error) {
          logger.error({ err: error, resumeId: candidate.resumeId }, 'Failed to summarize candidate');
          candidate.summary = 'Summary generation failed.';
        }
      });

      await Promise.all(summarizePromises);
      componentTimings.summarizeMs = Math.round(performance.now() - summarizeStart);
    }

    // durationMs removed - not used

    // Clean up results: omit searchType for bm25 results to avoid exposing bm25 in output
    const cleanedResults = finalRanked.map(item => {
      if (item.searchType === 'bm25') {
        const { searchType, ...rest } = item as any;
        return rest;
      }
      return item;
    });

    // Build response matching the expected schema
    const response = {
      query,
      topK,
      rerankTopK: rerankTopN,
      summarize,
      summarizeTopK: topK,
      summaryStyle,
      bm25Fallback: fallbacks.bm25Fallback,
      vectorFallback: fallbacks.vectorFallback,
      rerankFallback: fallbacks.rerankFallback,
      componentTimings: {
        bm25Ms: componentTimings.bm25Ms,
        vectorMs: componentTimings.vectorMs,
        rerankMs: componentTimings.rerankMs,
        summarizeMs: componentTimings.summarizeMs,
      },
      results: cleanedResults,
    };

    return response;
  }
}
