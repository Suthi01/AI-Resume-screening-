/**
 * Application-wide constants.
 * Never hardcode magic numbers in services — reference these instead.
 */

/** Maximum request payload size in bytes (1 MB) */
export const MAX_PAYLOAD_BYTES = 1_048_576;

/** Default number of candidates for LLM re-ranking */
export const DEFAULT_RERANK_TOP_N = 10;

/** Default top-K for BM25 / vector searches */
export const DEFAULT_SEARCH_TOP_K = 20;

/** Mistral embedding dimensions (model-determined) */
export const EMBEDDING_DIMENSIONS = 1024;

/** API version prefix */
export const API_VERSION = 'v1';

/** Maximum retries for external API calls */
export const MAX_API_RETRIES = 3;

/** Base delay between retries in ms (exponential back-off) */
export const RETRY_BASE_DELAY_MS = 500;

/** Resume text snippet length for candidate display */
export const SNIPPET_MAX_LENGTH = 500;

/** Maximum input text length for embedding requests */
export const EMBEDDING_INPUT_MAX_LENGTH = 32_000;

/** Maximum query length for search requests */
export const SEARCH_QUERY_MAX_LENGTH = 2_000;
