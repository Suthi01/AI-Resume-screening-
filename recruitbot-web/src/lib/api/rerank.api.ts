import apiClient from './client';
import type { RerankRequest, RerankResponse } from '@/types/search.types';

/**
 * POST /v1/search/rerank
 * Sends a list of candidate snippets to the LLM for re-ranking.
 */
export const rerankApi = {
  async rerank(body: RerankRequest): Promise<RerankResponse> {
    const response = await apiClient.post<RerankResponse>('/v1/search/rerank', body);
    return response.data;
  },
};
