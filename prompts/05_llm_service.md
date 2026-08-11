# Prompt 05 — LLMService (Re-ranking & Summarization)

> **When to use**: After hybrid search works, implement the Groq LLM integration
> for re-ranking, summarization, and metadata extraction.

---

## System Context

```
You are implementing Steps 6–7 of the Resume AI RAG project.
SearchService with BM25, vector, and hybrid search is in place.
Refer to `prompts/copilot_instructions.md` for architecture and standards.
LLM provider: Groq API with model `meta-llama/llama-4-scout-17b-16e-instruct`.
```

---

## Task 1: LLMService

Generate `src/services/LLMService.ts`:

### Constructor
- Accepts config: `{ apiKey, model, baseUrl, maxRetries }`.
- Groq API base URL: `https://api.groq.com/openai/v1/chat/completions`
- Auth: `Authorization: Bearer <GROQ_API_KEY>`

### Method 1: `rerankCandidates(query, candidates, topK)`

**Signature**:
```typescript
async rerankCandidates(
  query: string,
  candidates: ResumeSearchResult[],
  topK: number
): Promise<RankedResumeResult[]>
```

**LLM Prompt** (system + user):
```
SYSTEM:
You are an expert technical recruiter AI. Your task is to re-rank resume candidates
based on how well they match a job search query.

Evaluate each candidate on:
1. Skills match (exact and related skills)
2. Experience relevance (years + domain fit)
3. Role alignment (current/past roles vs. query)
4. Education fit (if relevant to query)

Return a JSON array of objects with this exact schema:
[
  { "resumeId": "<id>", "rank": 1, "score": 95, "reasoning": "Strong match because..." },
  ...
]
Order by score descending. Score is 0–100.
Return ONLY valid JSON, no markdown fences, no extra text.

USER:
**Search Query**: <query>

**Candidates**:
<for each candidate, numbered>
ID: <resumeId>
Name: <name>
Role: <role> at <company>
Skills: <skills>
Experience: <totalExperience> years
Snippet: <snippet (first 400 chars)>
---
</for each>

Re-rank these candidates. Return the top <topK> as JSON.
```

**Implementation Notes**:
- Parse the LLM JSON response. If parsing fails, retry once with a stricter prompt.
- If LLM call fails entirely after retries, throw `AppError(503, 'RERANK_FAILED')`.
- Log: input candidate count, output count, LLM latency, token usage.

---

### Method 2: `summarizeCandidateFit(query, candidate, options)`

**Signature**:
```typescript
async summarizeCandidateFit(
  query: string,
  candidate: ResumeSearchResult,
  options: { style: 'short' | 'detailed'; maxTokens: number }
): Promise<string>
```

**LLM Prompt**:
```
SYSTEM:
You are a professional recruiter assistant. Summarize how well the candidate
fits the search query / job description.

Style: <short | detailed>
- "short": 2–3 sentences, highlight key strengths and gaps.
- "detailed": 5–8 sentences, cover skills, experience, role fit, and growth potential.

Return ONLY the summary text, no JSON, no markdown headers.

USER:
**Search Query / Job Description**: <query>

**Candidate**:
Name: <name>
Role: <role> at <company>
Skills: <skills>
Experience: <totalExperience> years
Education: <education>
Resume Excerpt: <snippet>

Provide your assessment.
```

---

### Method 3: `extractMetadata(rawText)`

**Signature**:
```typescript
async extractMetadata(rawText: string): Promise<{
  skills: string[];
  jobTitles: string[];
  experienceSummary: string;
}>
```

**LLM Prompt**:
```
SYSTEM:
Extract structured metadata from the following resume text.
Return a JSON object with exactly these fields:
{
  "skills": ["skill1", "skill2", ...],
  "jobTitles": ["title1", "title2", ...],
  "experienceSummary": "Brief 1-2 sentence summary of total experience"
}
Return ONLY valid JSON.

USER:
<rawText>
```

---

## Task 2: Re-rank Route

Update `src/routes/search.routes.ts`:

### `POST /v1/search/rerank`

**Request Validation**:
```typescript
const rerankSchema = z.object({
  query: z.string().min(1).max(2000),
  candidates: z.array(z.object({
    resumeId: z.string(),
    snippet: z.string(),
    name: z.string().optional(),
    role: z.string().optional(),
    skills: z.array(z.string()).optional(),
    totalExperience: z.number().optional(),
  })).min(1).max(50),
  topK: z.number().int().min(1).max(30).optional().default(10),
});
```

**Response** (200):
```json
{
  "results": [
    { "resumeId": "...", "rank": 1, "score": 95, "reasoning": "..." },
    ...
  ],
  "durationMs": 1200
}
```

---

## Task 3: Summarize Route

### `POST /v1/search/summarize`

**Request Validation**:
```typescript
const summarizeSchema = z.object({
  query: z.string().min(1).max(2000),
  candidate: z.object({
    resumeId: z.string(),
    snippet: z.string(),
    name: z.string().optional(),
    role: z.string().optional(),
    skills: z.array(z.string()).optional(),
    totalExperience: z.number().optional(),
    education: z.string().optional(),
  }),
  style: z.enum(['short', 'detailed']).optional().default('short'),
  maxTokens: z.number().int().min(50).max(1000).optional().default(300),
});
```

**Response** (200):
```json
{
  "summary": "The candidate is a strong fit because...",
  "style": "short",
  "durationMs": 800
}
```

---

## Task 4: Unit Tests

Generate `src/tests/unit/LLMService.test.ts`:
- Mock the Groq API.
- Test: `rerankCandidates` returns sorted results.
- Test: `rerankCandidates` handles malformed LLM JSON gracefully.
- Test: `summarizeCandidateFit` returns text summary.
- Test: `extractMetadata` returns structured metadata.
- Test: retries on transient failures.

---

## Verification Checklist
- [ ] `POST /v1/search/rerank` accepts candidates and returns LLM-ranked list.
- [ ] `POST /v1/search/summarize` returns a textual summary.
- [ ] LLM response parsing handles edge cases (markdown fences, extra text).
- [ ] Retry logic works for 429/500/503.
- [ ] Unit tests pass.
