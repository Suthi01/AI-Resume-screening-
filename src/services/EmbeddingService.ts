import axios from 'axios';
import { AppConfig } from '../config';
import { EmbeddingResponse, MistralEmbeddingAPIResponse } from '../types/embedding.types';
import { AppError } from '../types/common.types';
import { logger } from './LoggingService';
import { MAX_API_RETRIES, RETRY_BASE_DELAY_MS } from '../config/constants';

/**
 * Helper to delay execution (exponential backoff).
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class EmbeddingService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl: string;

  constructor(config: AppConfig) {
    this.apiKey = config.mistralApiKey;
    this.defaultModel = config.mistralEmbedModel;
    this.baseUrl = config.mistralApiBaseUrl;
  }

  /**
   * Generates a vector embedding for the given input string using the Mistral API.
   * Includes retry logic with exponential backoff for transient errors.
   *
   * @param input Text to embed
   * @param model Optional model override
   * @returns The embedding vector and metadata
   */
  async generateEmbedding(input: string, model?: string): Promise<EmbeddingResponse> {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      throw new AppError('Embedding input cannot be empty', 400, 'BAD_REQUEST');
    }

    const selectedModel = model || this.defaultModel;
    const url = `${this.baseUrl}/embeddings`;
    
    let attempt = 0;
    const startTime = performance.now();

    while (attempt <= MAX_API_RETRIES) {
      try {
        const response = await axios.post<MistralEmbeddingAPIResponse>(
          url,
          {
            model: selectedModel,
            input: [trimmedInput],
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
          }
        );

        const data = response.data;
        
        if (!data.data || !data.data[0] || !data.data[0].embedding) {
          throw new AppError('Invalid response format from Mistral API', 500, 'BAD_GATEWAY');
        }

        const embedding = data.data[0].embedding;
        const durationMs = Math.round(performance.now() - startTime);

        logger.info(
          {
            model: selectedModel,
            inputLength: trimmedInput.length,
            durationMs,
            usageTokens: data.usage.total_tokens,
          },
          'Embedding generated successfully'
        );

        return {
          embedding,
          model: selectedModel,
          dimensions: embedding.length,
          usageTokens: data.usage.total_tokens,
        };

      } catch (error) {
        attempt++;
        const isLastAttempt = attempt > MAX_API_RETRIES;

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          
          if (status === 401 || status === 403) {
            throw new AppError('Invalid Mistral API Key or unauthorized', 401, 'UNAUTHORIZED');
          }
          
          if (status === 400) {
            throw new AppError(`Bad request to Mistral API: ${JSON.stringify(error.response?.data)}`, 400, 'BAD_REQUEST');
          }

          // Transient errors (429 Rate Limit, 5xx Server Error)
          if ((status === 429 || (status && status >= 500) || error.code === 'ECONNABORTED')) {
            if (!isLastAttempt) {
              const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
              logger.warn({ status, attempt, backoff }, 'Mistral API transient error, retrying...');
              await delay(backoff);
              continue;
            } else {
              throw new AppError('Max retries reached for Mistral API', 503, 'UPSTREAM_TIMEOUT');
            }
          }

          throw new AppError(
            `Mistral API failed: ${error.message}`, 
            status === 429 ? 429 : 503, 
            status === 429 ? 'RATE_LIMIT' : 'UPSTREAM_ERROR'
          );
        }

        // Non-axios error
        if (isLastAttempt) {
          throw new AppError('Max retries reached for Mistral API', 503, 'UPSTREAM_TIMEOUT');
        }
      }
    }

    throw new AppError('Max retries reached for Mistral API', 503, 'UPSTREAM_TIMEOUT');
  }
}
