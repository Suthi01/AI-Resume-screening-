# Prompt 10 — Editing & Extending Existing Code

> **When to use**: When you need co-pilot to modify, extend, or add features
> to already-implemented code without breaking existing functionality.

---

## System Context

```
You are modifying existing code in the Resume AI RAG project.
Refer to `prompts/copilot_instructions.md` for architecture and standards.

When editing existing code:
1. NEVER remove existing functionality unless explicitly asked.
2. Preserve all existing comments, JSDoc, and docstrings.
3. Maintain backward compatibility on all public interfaces.
4. Show changes as diffs — clearly indicate what is added, modified, or removed.
5. Update related tests to cover the new/changed behavior.
6. Update types/interfaces if the change affects the contract.
```

---

## Edit Prompt Templates

### Add a New Field to Response
```
Add a new field `<fieldName>` of type `<type>` to the <endpoint> response.

Requirements:
- Source the value from <where it comes from>.
- Update the response interface in `src/types/search.types.ts`.
- Update the service method that builds the response.
- Update the route handler if needed.
- Update related tests.
- Ensure the field is optional and doesn't break existing consumers.

Provide diffs for each file.
```

### Add a New Filter
```
Add a new search filter `<filterName>` to the BM25 and vector search endpoints.

Requirements:
- Add to `SearchFilters` interface.
- Add to Zod validation schema.
- Update ResumeRepository to apply the filter in aggregation pipelines.
- Update SearchService if needed.
- Add test cases for the new filter.
```

### Add a New Endpoint
```
Add a new endpoint: <METHOD> /v1/<path>

Purpose: <description>

Request body:
<schema>

Response:
<schema>

Implementation:
- Create/update the route file.
- Create/update the service method.
- Add Zod validation.
- Add unit and integration tests.
- Wire into the route aggregator.

Follow the same patterns used by existing endpoints.
```

### Modify LLM Prompts
```
The LLM prompt for <rerankCandidates | summarizeCandidateFit | extractMetadata>
needs to be updated.

Current prompt produces: <describe the issue>
Desired behavior: <describe what you want>

Update the prompt in `src/services/LLMService.ts`.
Ensure the response parsing still works with the new prompt.
Add a test case for the updated behavior.
```

### Add Caching Layer
```
Add an in-memory cache (e.g., using `node-cache` or a simple Map with TTL)
for <embeddings | search results | LLM responses>.

Requirements:
- Cache key: <define key strategy>
- TTL: <duration>
- Max entries: <limit>
- Cache hit/miss logging.
- Bypass cache when `?noCache=true` is passed.
- Do not cache error responses.

Create `src/services/CacheService.ts` and integrate it into <target service>.
```

### Add Rate Limiting
```
Add rate limiting middleware to protect against abuse.

Requirements:
- Use `express-rate-limit` or implement a token bucket.
- Global limit: 100 requests per minute per IP.
- Per-endpoint limits:
  - /v1/search: 20 requests per minute (LLM-intensive).
  - /v1/embeddings: 50 requests per minute.
  - /v1/health/*: unlimited.
- Return 429 with Retry-After header.
- Log rate-limited requests.
```

### Add Pagination
```
Add cursor-based pagination to the BM25 and vector search endpoints.

Requirements:
- Add `cursor` and `pageSize` to request schema.
- Return `nextCursor` in response if more results exist.
- Update ResumeRepository to support cursor-based queries.
- Ensure hybrid search works with pagination.
```

---

## Safe Edit Checklist

Before submitting any edit, verify:
- [ ] Existing tests still pass (`npm test`).
- [ ] New behavior has test coverage.
- [ ] Types/interfaces are updated consistently.
- [ ] No `any` types introduced.
- [ ] Error handling covers the new code path.
- [ ] Logging includes the new operation.
- [ ] API response format is backward-compatible.

---

*Use these templates to guide co-pilot when extending the codebase. They ensure
changes are safe, tested, and architecturally consistent.*
