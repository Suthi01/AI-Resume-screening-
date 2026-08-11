import dotenv from 'dotenv';
import path from 'path';

// Load .env before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Validated, frozen application configuration.
 * Throws on startup if required variables are missing.
 */
export interface AppConfig {
  /** Server */
  readonly port: number;
  readonly nodeEnv: string;

  /** MongoDB */
  readonly mongodbUri: string;
  readonly mongodbDbName: string;
  readonly mongodbCollection: string;
  readonly mongodbBm25IndexName: string;
  readonly mongodbVectorIndexName: string;

  /** Mistral Embedding API */
  readonly mistralApiKey: string;
  readonly mistralEmbedModel: string;
  readonly mistralEmbedDimensions: number;
  readonly mistralApiBaseUrl: string;

  /** Groq LLM API */
  readonly groqApiKey: string;
  readonly groqLlmModel: string;
  readonly groqApiBaseUrl: string;

  /** Search defaults */
  readonly rerankTopN: number;
  readonly defaultSearchTopK: number;

  /** Limits */
  readonly maxPayloadBytes: number;
  readonly logLevel: string;
}

/**
 * Read an env var; throw if required and missing.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') return fallback;
  const parsed = parseInt(raw.trim(), 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

function buildConfig(): AppConfig {
  return Object.freeze({
    port: optionalInt('PORT', 3000),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),

    mongodbUri: requireEnv('MONGODB_URI'),
    mongodbDbName: optionalEnv('MONGODB_DB_NAME', 'resumes_db'),
    mongodbCollection: optionalEnv('MONGODB_COLLECTION', 'resumes'),
    mongodbBm25IndexName: optionalEnv('MONGODB_BM25_INDEX_NAME', 'bm25'),
    mongodbVectorIndexName: optionalEnv('MONGODB_VECTOR_INDEX_NAME', 'vector_index'),

    mistralApiKey: requireEnv('MISTRAL_API_KEY'),
    mistralEmbedModel: optionalEnv('MISTRAL_EMBED_MODEL', 'mistral-embed'),
    mistralEmbedDimensions: optionalInt('MISTRAL_EMBED_DIMENSIONS', 1024),
    mistralApiBaseUrl: optionalEnv('MISTRAL_API_BASE_URL', 'https://api.mistral.ai/v1'),

    groqApiKey: requireEnv('GROQ_API_KEY'),
    groqLlmModel: optionalEnv('GROQ_LLM_MODEL', 'llama-3.3-70b-versatile'),
    groqApiBaseUrl: optionalEnv('GROQ_API_BASE_URL', 'https://api.groq.com/openai/v1'),

    rerankTopN: optionalInt('RERANK_TOP_N', 10),
    defaultSearchTopK: optionalInt('DEFAULT_SEARCH_TOP_K', 20),

    maxPayloadBytes: optionalInt('MAX_PAYLOAD_BYTES', 1_048_576),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),
  });
}

export const config: AppConfig = buildConfig();
