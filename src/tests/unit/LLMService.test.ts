import { LLMService } from '../../services/LLMService';
import { AppConfig } from '../../config';
import axios from 'axios';
import { CandidateSnippet } from '../../types/search.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LLMService', () => {
  let llmService: LLMService;
  
  const mockConfig = {
    groqApiKey: 'test-key',
    groqApiBaseUrl: 'https://api.groq.com/openai/v1',
    groqLlmModel: 'test-model'
  } as AppConfig;

  const mockPost = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: mockPost
    } as any);
    
    llmService = new LLMService(mockConfig);
  });

  const candidates: CandidateSnippet[] = [
    { resumeId: 'id-1', snippet: 'React dev' },
    { resumeId: 'id-2', snippet: 'Node.js backend' },
    { resumeId: 'id-3', snippet: 'Fullstack' }
  ];

  describe('rerankCandidates', () => {
    it('should return empty array if input is empty', async () => {
      const result = await llmService.rerankCandidates('query', []);
      expect(result).toEqual([]);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should return the single candidate if only one is provided', async () => {
      const result = await llmService.rerankCandidates('query', [candidates[0]]);
      expect(result).toEqual([candidates[0]]);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should correctly parse LLM JSON and reorder candidates', async () => {
      // Mock LLM returning id-2, id-3, id-1
      mockPost.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: '["id-2", "id-3", "id-1"]'
              }
            }
          ]
        }
      });

      const result = await llmService.rerankCandidates('backend developer', candidates, 3);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0].resumeId).toBe('id-2');
      expect(result[1].resumeId).toBe('id-3');
      expect(result[2].resumeId).toBe('id-1');
    });

    it('should fallback to original order if LLM returns invalid JSON', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'This is not valid JSON'
              }
            }
          ]
        }
      });

      const result = await llmService.rerankCandidates('backend developer', candidates, 3);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0].resumeId).toBe('id-1'); // Original order preserved
      expect(result[1].resumeId).toBe('id-2');
    });

    it('should fallback to original order if API throws an error', async () => {
      mockPost.mockRejectedValue(new Error('API Down'));

      const result = await llmService.rerankCandidates('backend developer', candidates, 3);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0].resumeId).toBe('id-1');
    });

    it('should strip markdown backticks and parse correctly', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: '```json\n["id-3", "id-1", "id-2"]\n```'
              }
            }
          ]
        }
      });

      const result = await llmService.rerankCandidates('query', candidates, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0].resumeId).toBe('id-3');
      expect(result[1].resumeId).toBe('id-1');
    });

    it('should slice results to topK', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: '["id-2", "id-3", "id-1"]'
              }
            }
          ]
        }
      });

      const result = await llmService.rerankCandidates('query', candidates, 2); // topK = 2
      
      expect(result).toHaveLength(2);
      expect(result[0].resumeId).toBe('id-2');
      expect(result[1].resumeId).toBe('id-3');
    });
  });

  describe('summarizeCandidateFit', () => {
    const candidate = { resumeId: 'id-1', snippet: 'React dev with 5 years exp.' };
    const query = 'frontend engineer';

    it('should generate a summary successfully with default options', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'This candidate is a great fit.' } }]
        }
      });

      const result = await llmService.summarizeCandidateFit(query, candidate);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toBe('This candidate is a great fit.');
    });

    it('should handle short style instruction', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Good fit.' } }]
        }
      });

      const result = await llmService.summarizeCandidateFit(query, candidate, { style: 'short' });
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      const postArgs = mockPost.mock.calls[0][1];
      expect(postArgs.messages[1].content).toContain('2-3 sentence summary');
      expect(result).toBe('Good fit.');
    });

    it('should handle API failure gracefully', async () => {
      mockPost.mockRejectedValue(new Error('API Down'));

      const result = await llmService.summarizeCandidateFit(query, candidate);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toBe('Summary generation failed due to an error.');
    });

    it('should handle empty response gracefully', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: '' } }]
        }
      });

      const result = await llmService.summarizeCandidateFit(query, candidate);
      
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toBe('Summary generation failed due to an error.');
    });
  });
});
