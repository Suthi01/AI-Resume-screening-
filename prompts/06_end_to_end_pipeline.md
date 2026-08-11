# Prompt 06 — End-to-End Search Pipeline

> **When to use**: After all individual components (BM25, vector, rerank, summarize) work,
> wire them into the full `/v1/search` pipeline with fallback logic and logging.

---

## System Context

```
You are implementing Step 8 of the Resume AI RAG project.
All services (EmbeddingService, SearchService, LLMService, ResumeRepository) are in place.
Individual endpoints (/v1/search/bm25, vector, hybrid, rerank, summarize) are working.
Refer to `prompts/copilot_instructions.md` for architecture and standards.
```

---

## Task 1: End-to-End Search Method

Update `src/services/SearchService.ts`:

### `async endToEndSearch(request: EndToEndSearchRequest): Promise<EndToEndSearchResponse>`

**Synchronous Flow**:
```
Step 1: Validate & extract parameters
Step 2: Generate query embedding (on-demand)          → time as embeddingMs
Step 3: Run BM25 search                               → time as bm25Ms
Step 4: Run vector search (using Step 2 embedding)     → time as vectorMs
     Note: Steps 3 & 4 run in parallel via Promise.allSettled
Step 5: Merge & deduplicate candidates (from utils/dedup.ts)
Step 6: Take top N for re-ranking (default 10, configurable)
Step 7: Call LLMService.rerankCandidates               → time as rerankMs
Step 8: If request.summarize === true:
        Call LLMService.summarizeCandidateFit for each top result → time as summarizeMs
Step 9: Build & return response with meta
```

**Fallback Logic** (critical — implement exactly):
```typescript
// Step 3-4: Parallel with fallback
const [bm25Result, vectorResult] = await Promise.allSettled([
  this.bm25Search(query, filters, topK),
  this.vectorSearch(query, filters, topK),  // reuses pre-generated embedding
]);

let bm25Results: ResumeSearchResult[] = [];
let vectorResults: ResumeSearchResult[] = [];
const fallbacks = { bm25Fallback: false, vectorFallback: false, rerankFallback: false };

if (bm25Result.status === 'fulfilled') {
  bm25Results = bm25Result.value.results;
} else {
  logger.error({ err: bm25Result.reason, requestId }, 'BM25 search failed, using vector only');
  fallbacks.bm25Fallback = true;
}

if (vectorResult.status === 'fulfilled') {
  vectorResults = vectorResult.value.results;
} else {
  logger.error({ err: vectorResult.reason, requestId }, 'Vector search failed, using BM25 only');
  fallbacks.vectorFallback = true;
}

if (bm25Results.length === 0 && vectorResults.length === 0) {
  throw new AppError('Both search methods failed', 503, 'SEARCH_FAILED');
}

// Step 5: Merge & deduplicate
const merged = deduplicateCandidates(bm25Results, vectorResults);

// Step 6-7: Re-rank with fallback
const topCandidates = merged.slice(0, rerankTopN);
let rankedResults: RankedResumeResult[];

try {
  rankedResults = await this.llmService.rerankCandidates(query, topCandidates, rerankTopN);
} catch (err) {
  logger.error({ err, requestId }, 'LLM rerank failed, using hybrid ordering (BM25 priority)');
  fallbacks.rerankFallback = true;
  // Fallback: BM25 results first, then vector, with rank assigned by position
  rankedResults = topCandidates.map((r, i) => ({ ...r, rank: i + 1 }));
}

// Step 8: Optional summarization (fail silently per candidate)
if (request.summarize) {
  const summaryPromises = rankedResults.map(async (r) => {
    try {
      r.summary = await this.llmService.summarizeCandidateFit(query, r, {
        style: request.summaryStyle || 'short',
        maxTokens: request.summaryMaxTokens || 300,
      });
    } catch {
      r.summary = undefined; // Silently skip failed summaries
    }
  });
  await Promise.allSettled(summaryPromises);
}
```

---

## Task 2: End-to-End Search Route

Update `src/routes/search.routes.ts`:

### `POST /v1/search`

**Request Validation**:
```typescript
const endToEndSearchSchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(100).optional().default(20),
  filters: searchFiltersSchema.optional(),
  summarize: z.boolean().optional().default(false),
  summaryStyle: z.enum(['short', 'detailed']).optional().default('short'),
  summaryMaxTokens: z.number().int().min(50).max(1000).optional().default(300),
  rerankTopN: z.number().int().min(1).max(30).optional().default(10),
});
```

**Response** (200):
```json
{
  "results": [
    {
      "rank": 1,
      "resumeId": "691db80aa895776f97b6eca6",
      "name": "ASHWIN P",
      "role": "QA Engineer",
      "company": "Tcs",
      "skills": ["Selenium WebDriver", "TestNG", "Java"],
      "totalExperience": 1.3,
      "snippet": "ASHWIN P is an experienced Automation QA...",
      "rerankScore": 92,
      "summary": "Strong match for automation testing roles..."
    }
  ],
  "meta": {
    "query": "senior node.js backend engineer",
    "totalCandidates": 25,
    "rerankTopN": 10,
    "durationMs": 3200,
    "componentTimings": {
      "embeddingMs": 180,
      "bm25Ms": 290,
      "vectorMs": 310,
      "rerankMs": 1400,
      "summarizeMs": 980
    },
    "fallbacks": {
      "bm25Fallback": false,
      "vectorFallback": false,
      "rerankFallback": false
    }
  }
}
```

---

## Task 3: Component Timing Utility

Generate `src/utils/timer.ts`:

```typescript
/**
 * Precision timer using performance.now().
 * Usage:
 *   const timer = createTimer();
 *   // ... do work ...
 *   const elapsed = timer.stop(); // returns milliseconds
 */
export function createTimer(): { stop: () => number } {
  const start = performance.now();
  return {
    stop: () => Math.round(performance.now() - start),
  };
}
```

---

## Task 4: Integration Test

Generate `src/tests/integration/search.integration.test.ts`:
- Use `supertest` with the Express app.
- Test: `POST /v1/search` with valid query returns ranked results.
- Test: response includes `meta.componentTimings`.
- Test: response includes `meta.fallbacks` (all false on success).
- Test: invalid query returns 400.
- Test: oversized payload returns 413.

---

## Verification Checklist
- [ ] `POST /v1/search` executes the full pipeline and returns ranked results.
- [ ] Component timings are accurate and included in response.
- [ ] Fallback flags are set correctly when a component fails.
- [ ] Summarization is included when `summarize: true`.
- [ ] Summarization is skipped (no error) when `summarize: false`.
- [ ] Integration tests pass.
