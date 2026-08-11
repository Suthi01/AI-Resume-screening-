# Prompt 04 — Vector Search & Hybrid Search

> **When to use**: After BM25 search works, implement the vector search endpoint
> and the hybrid search that combines both.

---

## System Context

```
You are implementing Steps 4–5 of the Resume AI RAG project.
BM25 search, EmbeddingService, and ResumeRepository are in place.
Refer to `prompts/copilot_instructions.md` for architecture and standards.
```

---

## Task 1: Vector Search Route

Update `src/routes/search.routes.ts`:

### `POST /v1/search/vector`

**Flow**:
1. Validate request body (same schema as BM25).
2. Call `EmbeddingService.generateEmbedding(query)` to get query vector.
3. Call `ResumeRepository.vectorSearch(embedding, filters, topK)`.
4. Record timing for both embedding and vector search.
5. Return results.

**Response** (200):
```json
{
  "results": [ { "resumeId": "...", "name": "...", "score": 0.89, "searchType": "vector", ... } ],
  "total": 10,
  "durationMs": 450,
  "embeddingMs": 200
}
```

---

## Task 2: SearchService — Core Orchestrator

Generate `src/services/SearchService.ts`:

### Constructor
- Accepts `ResumeRepository`, `EmbeddingService`, `LLMService` (can be `null` initially).

### Methods

#### `async bm25Search(query, filters, topK): Promise<BM25SearchResponse>`
- Delegates to `ResumeRepository.bm25Search`.
- Wraps with timing.

#### `async vectorSearch(query, filters, topK): Promise<VectorSearchResponse>`
- Calls `EmbeddingService.generateEmbedding(query)`.
- Calls `ResumeRepository.vectorSearch(embedding, filters, topK)`.
- Wraps with timing.

#### `async hybridSearch(query, filters, options): Promise<HybridSearchResponse>`
- Runs `bm25Search` and `vectorSearch` in **parallel** via `Promise.allSettled`.
- If one fails, return the other's results with fallback flag.
- If both fail, throw `AppError(503)`.
- Return both result lists without merging scores.

**Key implementation detail — `Promise.allSettled`**:
```typescript
const [bm25Result, vectorResult] = await Promise.allSettled([
  this.bm25Search(query, filters, topK),
  this.vectorSearch(query, filters, topK),
]);
```
- If `bm25Result.status === 'rejected'` → log error, set `bm25Fallback: true`, use empty array.
- If `vectorResult.status === 'rejected'` → log error, set `vectorFallback: true`, use empty array.

---

## Task 3: Hybrid Search Route

Update `src/routes/search.routes.ts`:

### `POST /v1/search/hybrid`

**Request Validation**: Same schema as BM25/vector.

**Response** (200):
```json
{
  "bm25Results": [ ... ],
  "vectorResults": [ ... ],
  "totalBM25": 15,
  "totalVector": 10,
  "durationMs": 520,
  "fallbacks": {
    "bm25Fallback": false,
    "vectorFallback": false
  }
}
```

---

## Task 4: Deduplication Helper

Generate `src/utils/dedup.ts`:

```typescript
/**
 * Merge BM25 and vector results, removing duplicates by resumeId.
 * When a resume appears in both lists, keep the one with higher score
 * and tag searchType as 'hybrid'.
 */
export function deduplicateCandidates(
  bm25Results: ResumeSearchResult[],
  vectorResults: ResumeSearchResult[]
): ResumeSearchResult[];
```

- Use a `Map<string, ResumeSearchResult>` keyed by `resumeId`.
- BM25 results are inserted first (priority).
- Vector results are added only if not already present.
- Return as array, preserving insertion order.

---

## Task 5: Unit Tests

Generate `src/tests/unit/SearchService.test.ts`:
- Mock `ResumeRepository` and `EmbeddingService`.
- Test: `hybridSearch` returns both lists in parallel.
- Test: `hybridSearch` degrades when BM25 fails.
- Test: `hybridSearch` degrades when vector fails.
- Test: `hybridSearch` throws 503 when both fail.

Generate `src/tests/unit/dedup.test.ts`:
- Test: duplicates removed correctly.
- Test: BM25 results take priority.
- Test: unique results from both lists are preserved.

---

## Verification Checklist
- [ ] `POST /v1/search/vector` generates embedding + returns vector results.
- [ ] `POST /v1/search/hybrid` returns both BM25 and vector lists.
- [ ] Hybrid gracefully degrades if one search type fails.
- [ ] Deduplication logic correctly merges both lists.
- [ ] Unit tests pass.
