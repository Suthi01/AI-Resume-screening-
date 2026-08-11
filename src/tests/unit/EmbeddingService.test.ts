import { EmbeddingService } from '../../services/EmbeddingService';
import { AppConfig } from '../../config';
import axios from 'axios';
import { AppError } from '../../types/common.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.isAxiosError.mockImplementation((payload) => payload && payload.isAxiosError === true);

const mockConfig = {
  mistralApiKey: 'test-key',
  mistralEmbedModel: 'test-model',
  mistralApiBaseUrl: 'https://api.mistral.ai/v1',
} as AppConfig;

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;

  beforeEach(() => {
    embeddingService = new EmbeddingService(mockConfig);
    jest.clearAllMocks();
  });

  it('should generate an embedding successfully', async () => {
    const mockEmbedding = Array(1024).fill(0.1);
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: [{ embedding: mockEmbedding }],
        usage: { total_tokens: 10 },
      },
    });

    const result = await embeddingService.generateEmbedding('hello world');

    expect(result.embedding).toEqual(mockEmbedding);
    expect(result.model).toEqual('test-model');
    expect(result.dimensions).toBe(1024);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/embeddings',
      { model: 'test-model', input: ['hello world'] },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('should throw AppError on empty input', async () => {
    await expect(embeddingService.generateEmbedding('   ')).rejects.toThrow(
      new AppError('Embedding input cannot be empty', 400, 'BAD_REQUEST')
    );
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should throw AppError on invalid API key (401)', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    await expect(embeddingService.generateEmbedding('test')).rejects.toThrow(
      new AppError('Invalid Mistral API Key or unauthorized', 401, 'UNAUTHORIZED')
    );
  });

  it('should retry on transient errors (429)', async () => {
    const mockEmbedding = Array(1024).fill(0.1);
    
    // Fail first time with 429
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 429 },
    });
    
    // Succeed second time
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: [{ embedding: mockEmbedding }],
        usage: { total_tokens: 10 },
      },
    });

    const result = await embeddingService.generateEmbedding('test');
    
    expect(result.embedding).toEqual(mockEmbedding);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('should throw AppError after max retries', async () => {
    mockedAxios.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });

    await expect(embeddingService.generateEmbedding('test')).rejects.toThrow(
      new AppError('Max retries reached for Mistral API', 503, 'UPSTREAM_TIMEOUT')
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });
});
