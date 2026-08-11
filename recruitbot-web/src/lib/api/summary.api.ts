import apiClient from './client';
import type { SummaryRequest, SummaryResponse } from '@/types/search.types';

/**
 * POST /v1/search/summarize
 * Asks the LLM to summarise a single candidate's fit for the given query.
 */
export const summaryApi = {
  async summarize(body: SummaryRequest): Promise<SummaryResponse> {
    const response = await apiClient.post<SummaryResponse>('/v1/search/summarize', body);
    return response.data;
  },
};
