# Prompt 08 — Testing Strategy

> **When to use**: When asking co-pilot to generate unit tests, integration tests,
> or end-to-end test suites for any component.

---

## System Context

```
You are writing tests for the Resume AI RAG project.
Framework: Jest + ts-jest. HTTP testing: supertest.
All tests are in `src/tests/unit/` and `src/tests/integration/`.
Refer to `prompts/copilot_instructions.md` for architecture and standards.

Testing principles:
- Mock external APIs (Mistral, Groq) — never call real APIs in tests.
- Mock MongoDB — use in-memory or mocked repository.
- Test both success and failure paths.
- Test fallback logic explicitly.
- Assert on response shape, status codes, and error messages.
- Use descriptive test names: "should <expected behavior> when <condition>".
```

---

## Jest Configuration

Generate `jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/repositories/**/*.ts',
    'src/middleware/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterSetup: ['<rootDir>/src/tests/setup.ts'],
};

export default config;
```

---

## Test Setup

Generate `src/tests/setup.ts`:
```typescript
// Silence logs during tests
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';

// Set test env vars
process.env.MISTRAL_API_KEY = 'test-mistral-key';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_resumes';
```

---

## Test Templates by Component

### EmbeddingService Tests
```
Generate unit tests for EmbeddingService that cover:
1. Successful embedding generation — returns 1024-dim vector.
2. Empty input — throws AppError(400).
3. Invalid API key — throws AppError(401).
4. Rate limit (429) — retries then throws AppError(429).
5. Server error (500) — retries 3 times then throws AppError(503).
6. Network timeout — throws AppError(503).
Mock axios for all external calls.
```

### ResumeRepository Tests
```
Generate unit tests for ResumeRepository that cover:
1. bm25Search with valid query — returns sorted results.
2. bm25Search with filters — applies experience range filter.
3. bm25Search with no matches — returns empty array.
4. vectorSearch with valid embedding — returns results with scores.
5. vectorSearch with dimension mismatch — throws AppError.
6. findById with valid ID — returns document.
7. findById with invalid ID — returns null.
Mock the MongoDB collection's aggregate method.
```

### SearchService Tests
```
Generate unit tests for SearchService that cover:
1. hybridSearch — runs BM25 and vector in parallel, returns both.
2. hybridSearch — BM25 fails, returns vector only with bm25Fallback: true.
3. hybridSearch — vector fails, returns BM25 only with vectorFallback: true.
4. hybridSearch — both fail, throws AppError(503).
5. endToEndSearch — full pipeline returns ranked results with timings.
6. endToEndSearch — rerank fails, falls back to hybrid ordering.
7. endToEndSearch — summarize: true generates summaries.
8. endToEndSearch — summary failure for one candidate doesn't fail the request.
Mock ResumeRepository, EmbeddingService, and LLMService.
```

### LLMService Tests
```
Generate unit tests for LLMService that cover:
1. rerankCandidates — returns sorted results from LLM.
2. rerankCandidates — handles markdown-fenced JSON in response.
3. rerankCandidates — retries on malformed JSON.
4. rerankCandidates — throws after max retries.
5. summarizeCandidateFit — returns text summary for "short" style.
6. summarizeCandidateFit — returns text summary for "detailed" style.
7. extractMetadata — returns skills, jobTitles, experienceSummary.
8. extractMetadata — handles partial/malformed LLM output.
Mock axios for Groq API calls.
```

### Middleware Tests
```
Generate unit tests for each middleware:
1. requestId — attaches UUID to req and X-Request-Id header.
2. sizeLimit — returns 413 for oversized payloads, passes normal ones.
3. errorHandler — maps AppError to correct status and JSON shape.
4. errorHandler — maps unknown errors to 500.
5. validateRequest — returns 400 with field errors for invalid body.
6. validateRequest — passes valid body to next().
```

---

### Integration Tests
```
Generate integration tests using supertest that cover:
1. GET /v1/health — returns 200 with service info.
2. GET /v1/health/db — returns DB status.
3. POST /v1/embeddings — returns embedding array.
4. POST /v1/search/bm25 — returns BM25 results.
5. POST /v1/search/vector — returns vector results.
6. POST /v1/search/hybrid — returns both result lists.
7. POST /v1/search/rerank — returns re-ranked list.
8. POST /v1/search/summarize — returns summary text.
9. POST /v1/search — returns full pipeline results.
10. POST /v1/search — with summarize: true includes summaries.
11. Invalid endpoint — returns 404.
12. Oversized payload — returns 413.
13. Missing required field — returns 400 with validation errors.
Mock all external services (Mistral, Groq, MongoDB).
```

---

## Test Fixtures

Generate `src/tests/fixtures/`:
- `sampleResumes.ts` — Array of 5 mock resume documents matching `IResumeDocument`.
- `sampleEmbeddings.ts` — Mock 1024-dim embedding vectors.
- `sampleLLMResponses.ts` — Mock Groq API responses for rerank, summarize, extractMetadata.

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# With coverage
npm test -- --coverage

# Single file
npm test -- --testPathPattern=EmbeddingService
```

---

*Use this prompt to generate comprehensive test suites. Always run `npm test` after
generating tests to verify they compile and pass.*
