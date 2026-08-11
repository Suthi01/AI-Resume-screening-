import { ResumeSearchResult } from './resume.types';

export interface SearchFilters {
  minYearsExperience?: number;
  maxYearsExperience?: number;
  skills?: string[];
  location?: string;
  role?: string;
}

export interface SearchRequest {
  query: string;
  topK?: number;          // default 20
  filters?: SearchFilters;
}

export interface BM25SearchResponse {
  results: ResumeSearchResult[];
  total: number;
  durationMs: number;
}

export interface VectorSearchResponse {
  results: ResumeSearchResult[];
  total: number;
  durationMs: number;
}

export interface HybridSearchResponse {
  results: ResumeSearchResult[];
  total: number;
  durationMs: number;
}

export interface EndToEndSearchRequest extends SearchRequest {
  summarize?: boolean;
  summaryStyle?: 'short' | 'detailed';
  summaryMaxTokens?: number;
  rerankTopN?: number;
}

export interface EndToEndSearchResponse {
  /** The original query string */
  query: string;
  /** Number of results requested */
  topK: number;
  /** Number of candidates sent to LLM for re‑ranking */
  rerankTopK: number;
  /** Whether summarization was performed */
  summarize: boolean;
  /** Number of top results to include summarizations for */
  summarizeTopK: number;
  /** Summarization style */
  summaryStyle?: 'short' | 'detailed';
  /** Fallback flags for each component */
  bm25Fallback: boolean;
  vectorFallback: boolean;
  rerankFallback: boolean;
  /** Timings for each pipeline stage (ms) */
  componentTimings: {
    bm25Ms: number;
    vectorMs: number;
    rerankMs: number;
    summarizeMs: number;
  };
  /** Final ranked results */
  results: RankedResumeResult[];
}

export interface RankedResumeResult extends ResumeSearchResult {
  rank: number;
  rerankScore?: number;
  summary?: string;
}

export interface CandidateSnippet {
  resumeId: string;
  snippet: string;
}

export interface RerankRequest {
  query: string;
  candidates: CandidateSnippet[];
  topK?: number;
}

export interface RerankResponse {
  results: CandidateSnippet[];
  durationMs: number;
}

export interface SummarizeOptions {
  style?: 'short' | 'detailed';
  maxTokens?: number;
}

export interface SummarizeRequest {
  query: string;
  candidate: CandidateSnippet;
  style?: 'short' | 'detailed';
  maxTokens?: number;
}

export interface SummarizeResponse {
  summary: string;
  durationMs: number;
}

