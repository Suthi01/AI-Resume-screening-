export interface EmbeddingRequest {
  model?: string;     // Optional override, default from config
  input: string;      // Text to embed
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  usageTokens: number;
}

// Mistral API response shape
export interface MistralEmbeddingAPIResponse {
  id: string;
  object: string;
  model: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
