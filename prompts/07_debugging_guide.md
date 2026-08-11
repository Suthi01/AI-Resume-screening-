# Prompt 07 — Debugging Guide

> **When to use**: Feed this prompt when asking co-pilot to help debug issues.
> It provides structured templates for common failure scenarios.

---

## System Context

```
You are debugging the Resume AI RAG project — a Node.js + TypeScript + Express API
using MongoDB Atlas (BM25 + Vector Search), Mistral embeddings, and Groq LLM.
Refer to `prompts/copilot_instructions.md` for full architecture.

When debugging, always:
1. Identify the exact error message and stack trace.
2. Determine which layer the error originates from (route, service, repository, external API).
3. Provide root cause analysis.
4. Provide the fix as a complete code diff.
5. Suggest a unit test to prevent regression.
```

---

## Debug Template — General

Use this template when pasting an error into co-pilot:

```
## Error
<paste error message and stack trace>

## Context
- Endpoint: <which endpoint was called>
- Request body: <the request payload>
- Environment: <dev/staging/prod>
- Last change: <what you changed before the error appeared>

## Expected behavior
<what should have happened>

## Actual behavior
<what happened instead>
```

---

## Common Issue: MongoDB Connection Failures

**Symptoms**: `MongoServerError`, `ECONNREFUSED`, timeout on startup.

**Debug Prompt**:
```
The server fails to connect to MongoDB on startup with the following error:
<error>

My MONGODB_URI is configured in .env. Diagnose the issue and provide:
1. A checklist of things to verify (IP whitelist, credentials, URI format).
2. Updated connection code with proper error handling and retry.
3. A health check that reports the exact connection state.
```

---

## Common Issue: Atlas Search / Vector Search Not Returning Results

**Symptoms**: BM25 or vector search returns empty array despite data existing.

**Debug Prompt**:
```
POST /v1/search/bm25 (or /vector) returns an empty results array even though
the resumes collection has <N> documents.

Query: "<the query>"
Filters: <the filters>

Possible causes to investigate:
1. Atlas Search index not created or not in READY state.
2. Aggregation pipeline field names don't match document schema.
3. Filter conditions are too restrictive.
4. For vector: embedding dimensions mismatch.

Provide:
- A diagnostic script that checks index status and sample document shape.
- Corrected aggregation pipeline if the issue is in the query.
```

---

## Common Issue: LLM JSON Parsing Failures

**Symptoms**: `SyntaxError: Unexpected token` when parsing LLM response.

**Debug Prompt**:
```
LLMService.rerankCandidates (or extractMetadata) fails to parse the LLM response.
Raw LLM output:
<paste the raw response>

The expected format is:
<paste expected JSON schema>

Provide:
1. A robust JSON extraction function that handles:
   - Markdown code fences (```json ... ```)
   - Leading/trailing whitespace and newlines
   - Partial JSON (truncated responses)
2. A retry strategy with a stricter prompt on first failure.
3. A fallback for when parsing fails entirely.
```

---

## Common Issue: Mistral API Errors

**Symptoms**: 401, 429, or 500 from Mistral embedding API.

**Debug Prompt**:
```
EmbeddingService.generateEmbedding fails with:
Status: <status code>
Response: <response body>

Diagnose and provide:
1. Root cause (auth, rate limit, invalid input, service down).
2. Fix with proper error mapping to AppError.
3. Retry configuration appropriate for this error type.
```

---

## Common Issue: Groq API Rate Limiting

**Symptoms**: 429 errors from Groq, especially during summarization of multiple candidates.

**Debug Prompt**:
```
LLMService calls to Groq are being rate-limited during the summarization phase
of the end-to-end pipeline. We're calling summarizeCandidateFit for <N> candidates
in parallel.

Provide:
1. A rate-limiting strategy (token bucket or semaphore).
2. Sequential processing with configurable concurrency.
3. Updated code that respects Groq's rate limits.
```

---

## Common Issue: Slow Response Times (P95 > 5s)

**Symptoms**: End-to-end search exceeds the 3–5s latency target.

**Debug Prompt**:
```
POST /v1/search is taking <X>ms on average. Component timings:
- embeddingMs: <...>
- bm25Ms: <...>
- vectorMs: <...>
- rerankMs: <...>
- summarizeMs: <...>

The bottleneck appears to be <component>.

Provide:
1. Optimization strategies for the bottleneck component.
2. Code changes to implement the most impactful optimization.
3. Caching strategies if applicable.
```

---

## Common Issue: TypeScript Compilation Errors

**Debug Prompt**:
```
TypeScript compilation fails with:
<paste tsc errors>

These errors appeared after <describe what changed>.
Provide fixes for each error while maintaining strict type safety.
Do not use `any` or `as any` to suppress errors.
```

---

## Debug Utility: Request Replay Script

When you need to replay a failing request:
```
Generate a standalone script at `src/tests/debug/replay.ts` that:
1. Reads a request payload from a JSON file.
2. Calls the relevant service method directly (bypassing Express).
3. Logs every intermediate result (embedding, BM25 results, vector results, LLM response).
4. Outputs full timing breakdown.
This helps isolate whether the issue is in the HTTP layer or the service layer.
```

---

*Use these templates whenever you encounter issues. They give co-pilot the context
it needs to provide targeted, actionable fixes instead of generic advice.*
