export type SearchMode = 'vector' | 'bm25' | 'hybrid';

/** Canonical result shape used by the UI */
export interface SearchResult {
  candidateId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  score: number;
  bm25Score?: number;
  vectorScore?: number;
  sources?: Array<'bm25' | 'vector' | 'hybrid'>;
  experienceYears?: number;
  content: string;
}

/** Canonical response shape used by the UI */
export interface SearchResponse {
  query: string;
  searchType: string;
  topK: number;
  resultCount: number;
  duration: number;
  results: SearchResult[];
  metadata?: Record<string, unknown>;
}

// ─── Rerank ──────────────────────────────────────────────────────────────────

/** One candidate item sent to POST /v1/search/rerank */
export interface RerankCandidate {
  resumeId: string;
  snippet: string;
}

/** Request body for POST /v1/search/rerank */
export interface RerankRequest {
  query: string;
  candidates: RerankCandidate[];
  topK?: number;
}

/** Response from POST /v1/search/rerank — results are CandidateSnippet[] (resumeId + snippet), NOT full SearchResults */
export interface RerankResponse {
  results: RerankCandidate[];
  total: number;
}

// ─── Summarize ───────────────────────────────────────────────────────────────

/** Summary style supported by the backend */
export type SummaryStyle = 'short' | 'detailed';

/** One candidate item sent to POST /v1/search/summarize */
export interface SummaryCandidate {
  resumeId: string;
  snippet: string;
}

/** Request body for POST /v1/search/summarize */
export interface SummaryRequest {
  query: string;
  candidate: SummaryCandidate;
  style?: SummaryStyle;
  maxTokens?: number;
}

/** Response from POST /v1/search/summarize */
export interface SummaryResponse {
  summary: string;
  durationMs: number;
}

