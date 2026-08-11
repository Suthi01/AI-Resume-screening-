import apiClient from './client';
import type { SearchMode } from '@/types/search.types';

/** Shared request body matching the backend searchSchema */
export interface BackendSearchRequest {
  query: string;
  topK?: number;
  bm25Weight?: number;
  vectorWeight?: number;
  filters?: {
    minYearsExperience?: number;
    maxYearsExperience?: number;
    skills?: string[];
    location?: string;
    role?: string;
  };
}

/** A single result as returned by the backend */
export interface BackendSearchResult {
  candidateId?: string;
  resumeId?: string;
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  score?: number;
  finalScore?: number;
  vectorScore?: number;
  bm25Score?: number;
  sources?: Array<'bm25' | 'vector' | 'hybrid'>;
  experienceYears?: number;
  totalExperience?: number;
  relevantExperience?: number;
  role?: string;
  company?: string;
  location?: string;
  skills?: string[];
  content?: string;
  snippet?: string;
}

/** Raw backend response shape */
export interface BackendSearchResponse {
  query: string;
  searchType?: string;
  topK?: number;
  resultCount?: number;
  total?: number;
  duration?: number;
  durationMs?: number;
  results?: BackendSearchResult[];
  candidates?: BackendSearchResult[];
  metadata?: Record<string, unknown>;
}

const ENDPOINT: Record<SearchMode, string> = {
  vector: '/v1/search/vector',
  bm25:   '/v1/search/bm25',
  hybrid: '/v1/search/hybrid',
};

export const searchApi = {
  async search(
    searchMode: SearchMode,
    body: BackendSearchRequest
  ): Promise<BackendSearchResponse> {
    const response = await apiClient.post<BackendSearchResponse>(
      ENDPOINT[searchMode],
      body
    );
    return response.data;
  },
};
