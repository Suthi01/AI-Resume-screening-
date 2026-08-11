# Prompt 02 — EmbeddingService & Embedding Endpoint

> **When to use**: After the scaffold is running, implement the Mistral embedding
> integration and the `/v1/embeddings` endpoint.

---

## System Context

```
You are implementing Step 2 of the Resume AI RAG project.
The project scaffold, config, health endpoints, and middleware are already in place.
Refer to `prompts/copilot_instructions.md` for architecture and standards.
```

---

## Task 1: Embedding Types

Generate `src/types/embedding.types.ts`:

```typescript
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
```

---

## Task 2: EmbeddingService

Generate `src/services/EmbeddingService.ts`:

### Requirements
- Constructor accepts config (API key, default model, base URL).
- Method: `async generateEmbedding(input: string, model?: string): Promise<EmbeddingResponse>`
  - Calls Mistral API: `POST https://api.mistral.ai/v1/embeddings`
  - Headers: `Authorization: Bearer <MISTRAL_API_KEY>`, `Content-Type: application/json`
  - Body: `{ model, input: [input] }`
  - Parse response, return the embedding vector + metadata.
- Implement retry with exponential back-off (max 3 attempts) for transient errors (429, 500, 503).
- Throw `AppError` with descriptive messages for:
  - Missing/invalid API key → `401`
  - Rate limit → `429`
  - API down → `503`
- Log: input length, model used, response latency, token usage.

### Example Implementation Pattern
```typescript
export class EmbeddingService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl: string;

  constructor(config: EmbeddingConfig) { /* ... */ }

  async generateEmbedding(input: string, model?: string): Promise<EmbeddingResponse> {
    const startTime = performance.now();
    // 1. Validate input is non-empty
    // 2. Call Mistral API with retry
    // 3. Parse response
    // 4. Log timing
    // 5. Return structured response
  }
}
```

---

## Task 3: Embedding Route

Generate `src/routes/embedding.routes.ts`:

### `POST /v1/embeddings`

**Request Validation (Zod)**:
```typescript
const embeddingSchema = z.object({
  model: z.string().optional(),
  input: z.string().min(1).max(32_000),  // Mistral limit
});
```

**Response** (200):
```json
{
  "embedding": [0.123, -0.456, ...],
  "model": "mistral-embed",
  "dimensions": 1024,
  "usageTokens": 42
}
```

**Error Responses**:
- `400` — Missing or invalid `input`.
- `429` — Upstream rate limit.
- `503` — Mistral API unreachable.

---

## Task 4: Wire Into App

Update `src/routes/index.ts` to mount embedding routes.
Update `src/app.ts` if needed to pass service instances.

---

## Task 5: Unit Test

Generate `src/tests/unit/EmbeddingService.test.ts`:
- Mock the Mistral API (axios).
- Test: successful embedding generation.
- Test: retry on 429.
- Test: throw AppError on invalid API key.
- Test: throw AppError on empty input.

---

## Verification Checklist
- [ ] `POST /v1/embeddings` with valid input returns 200 + embedding array.
- [ ] Embedding array length equals configured dimensions (1024).
- [ ] Invalid input returns 400 with field errors.
- [ ] Unit tests pass: `npm test -- --testPathPattern=EmbeddingService`
