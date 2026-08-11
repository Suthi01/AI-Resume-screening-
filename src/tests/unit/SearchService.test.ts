import { SearchService } from '../../services/SearchService';
import { ResumeRepository } from '../../repositories/ResumeRepository';
import { EmbeddingService } from '../../services/EmbeddingService';
import { LLMService } from '../../services/LLMService';
import { ResumeSearchResult } from '../../types/resume.types';

const mockResult: ResumeSearchResult = {
  resumeId: '123',
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'Engineer',
  company: 'Acme',
  location: 'Remote',
  skills: ['Java'],
  totalExperience: 5,
  relevantExperience: 5,
  education: 'BSc',
  snippet: 'Snippet',
  score: 0.95,
  searchType: 'bm25',
};

describe('SearchService', () => {
  let searchService: SearchService;
  let mockResumeRepository: jest.Mocked<ResumeRepository>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockLLMService: jest.Mocked<LLMService>;

  beforeEach(() => {
    mockResumeRepository = {
      bm25Search: jest.fn(),
      vectorSearch: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    } as any;

    mockEmbeddingService = {
      generateEmbedding: jest.fn(),
    } as any;

    mockLLMService = {
      rerankCandidates: jest.fn(),
      summarizeCandidateFit: jest.fn(),
    } as any;

    searchService = new SearchService(mockResumeRepository, mockEmbeddingService, mockLLMService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── bm25Search ───────────────────────────────────────────────

  describe('bm25Search', () => {
    it('should delegate to the repository and return results with timing', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([mockResult]);

      const response = await searchService.bm25Search('Software Engineer', { role: 'Engineer' }, 10);

      expect(mockResumeRepository.bm25Search).toHaveBeenCalledTimes(1);
      expect(mockResumeRepository.bm25Search).toHaveBeenCalledWith(
        'Software Engineer',
        { role: 'Engineer' },
        10,
      );

      expect(response.results).toEqual([mockResult]);
      expect(response.total).toBe(1);
      expect(response.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should use default filters and topK when not provided', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([]);

      await searchService.bm25Search('React developer');

      expect(mockResumeRepository.bm25Search).toHaveBeenCalledWith('React developer', {}, 20);
    });

    it('should return an empty result set when the repository returns nothing', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([]);

      const response = await searchService.bm25Search('no match query');

      expect(response.results).toEqual([]);
      expect(response.total).toBe(0);
    });

    it('should propagate errors thrown by the repository', async () => {
      mockResumeRepository.bm25Search.mockRejectedValue(new Error('Atlas Search unavailable'));

      await expect(searchService.bm25Search('test')).rejects.toThrow('Atlas Search unavailable');
    });

    it('should NOT call the embedding service for BM25 search', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([]);

      await searchService.bm25Search('Java developer');

      expect(mockEmbeddingService.generateEmbedding).not.toHaveBeenCalled();
    });
  });

  // ─── vectorSearch ─────────────────────────────────────────────

  describe('vectorSearch', () => {
    it('should generate an embedding and perform vector search', async () => {
      // Setup mocks
      const dummyEmbedding = Array(1024).fill(0.1);
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: dummyEmbedding,
        dimensions: 1024,
        model: 'test-model',
        usageTokens: 10,
      });

      const mockResults: ResumeSearchResult[] = [{ ...mockResult, searchType: 'vector' }];
      mockResumeRepository.vectorSearch.mockResolvedValue(mockResults);

      // Execute
      const response = await searchService.vectorSearch('Software Engineer', { role: 'Engineer' }, 10);

      // Assertions
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledTimes(1);
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('Software Engineer');

      expect(mockResumeRepository.vectorSearch).toHaveBeenCalledTimes(1);
      expect(mockResumeRepository.vectorSearch).toHaveBeenCalledWith(dummyEmbedding, { role: 'Engineer' }, 10);

      expect(response.total).toBe(1);
      expect(response.results).toEqual(mockResults);
      expect(response.durationMs).toBeGreaterThanOrEqual(0); // Takes >0 ms
    });

    it('should throw if embedding generation fails', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding API failed'));

      await expect(searchService.vectorSearch('test')).rejects.toThrow('Embedding API failed');
      expect(mockResumeRepository.vectorSearch).not.toHaveBeenCalled();
    });
  });

  // ─── hybridSearch ──────────────────────────────────────────────

  describe('hybridSearch', () => {
    const dummyEmbedding = Array(1024).fill(0.1);

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: dummyEmbedding,
        dimensions: 1024,
        model: 'test-model',
        usageTokens: 10,
      });
    });

    it('should run BM25 and vector search in parallel, merge results via RRF, and normalize scores', async () => {
      const bm25Results: ResumeSearchResult[] = [{ ...mockResult, searchType: 'bm25', resumeId: 'doc-1' }];
      const vectorResults: ResumeSearchResult[] = [{ ...mockResult, searchType: 'vector', resumeId: 'doc-1' }];

      mockResumeRepository.bm25Search.mockResolvedValue(bm25Results);
      mockResumeRepository.vectorSearch.mockResolvedValue(vectorResults);

      const response = await searchService.hybridSearch('Node.js developer', {}, 10);

      expect(response.results).toHaveLength(1);
      expect(response.total).toBe(1);
      
      const mergedDoc = response.results[0];
      expect(mergedDoc.resumeId).toBe('doc-1');
      expect(mergedDoc.searchType).toBe('hybrid');
      expect(mergedDoc.score).toBe(1.0); // Rank 1 in both should give max score (normalized to 1.0)
      
      expect(response.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should call bm25Search and vectorSearch each once with the same args', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([]);
      mockResumeRepository.vectorSearch.mockResolvedValue([]);

      await searchService.hybridSearch('React developer', { minYearsExperience: 3 }, 15);

      expect(mockResumeRepository.bm25Search).toHaveBeenCalledTimes(1);
      expect(mockResumeRepository.bm25Search).toHaveBeenCalledWith('React developer', { minYearsExperience: 3 }, 15);

      expect(mockResumeRepository.vectorSearch).toHaveBeenCalledTimes(1);
      expect(mockResumeRepository.vectorSearch).toHaveBeenCalledWith(dummyEmbedding, { minYearsExperience: 3 }, 15);

      // Embedding is only generated once (shared between both sub-searches)
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when both searches return nothing', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([]);
      mockResumeRepository.vectorSearch.mockResolvedValue([]);

      const response = await searchService.hybridSearch('no match');

      expect(response.results).toEqual([]);
      expect(response.total).toBe(0);
    });

    it('should propagate errors if embedding generation fails', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding timeout'));
      mockResumeRepository.bm25Search.mockResolvedValue([]);

      await expect(searchService.hybridSearch('fail case')).rejects.toThrow('Embedding timeout');
    });

    it('should propagate errors if BM25 search fails', async () => {
      mockResumeRepository.bm25Search.mockRejectedValue(new Error('Atlas BM25 down'));

      await expect(searchService.hybridSearch('fail case')).rejects.toThrow('Atlas BM25 down');
    });
  });

  // ─── endToEndSearch ─────────────────────────────────────────────

  describe('endToEndSearch', () => {
    it('should successfully orchestrate the full pipeline', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([mockResult]);
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: [0.1, 0.2],
        dimensions: 2,
        usageTokens: 10,
        model: 'model',
      });
      mockResumeRepository.vectorSearch.mockResolvedValue([{ ...mockResult, resumeId: '456' }]);
      mockLLMService.rerankCandidates.mockResolvedValue([
        { resumeId: '456', snippet: 'Snippet 456' },
        { resumeId: '123', snippet: 'Snippet 123' },
      ]);
      mockLLMService.summarizeCandidateFit.mockResolvedValue('Summary');

      const request = {
        query: 'test',
        topK: 2,
        summarize: true,
      };

      const res = await searchService.endToEndSearch(request);

      expect(res.results).toHaveLength(2);
      expect(res.results[0].resumeId).toBe('456');
      expect(res.results[1].resumeId).toBe('123');
      expect(res.results[0].summary).toBe('Summary');
      expect(mockLLMService.rerankCandidates).toHaveBeenCalledTimes(1);
      expect(mockLLMService.summarizeCandidateFit).toHaveBeenCalledTimes(2);
      // Verify total candidates via results length
      expect(res.results.length).toBe(2);
    });

    it('should fallback to RRF if LLM re-ranking fails', async () => {
      mockResumeRepository.bm25Search.mockResolvedValue([mockResult]); // 123
      mockEmbeddingService.generateEmbedding.mockResolvedValue({
        embedding: [0.1, 0.2],
        dimensions: 2,
        usageTokens: 10,
        model: 'model',
      });
      mockResumeRepository.vectorSearch.mockResolvedValue([]);
      
      mockLLMService.rerankCandidates.mockRejectedValue(new Error('LLM Down'));

      const request = { query: 'test' };
      const res = await searchService.endToEndSearch(request);

      // It should fallback to the RRF order (123 was the only result)
      expect(res.results).toHaveLength(1);
      expect(res.results[0].resumeId).toBe('123');
      expect(res.rerankFallback).toBe(true);
    });
  });
});
