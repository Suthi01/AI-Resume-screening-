import apiClient from './client';
import type { CandidateProfile } from '@/types/candidate.types';

export const candidateApi = {
  async getById(id: string): Promise<CandidateProfile> {
    const response = await apiClient.get<CandidateProfile>(`/v1/candidate/${id}`);
    return response.data;
  },
};
