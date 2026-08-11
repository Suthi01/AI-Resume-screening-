# Prompt 03 — ResumeRepository & BM25 Search

> **When to use**: After embeddings work, implement the MongoDB repository layer
> and the BM25 full-text search endpoint.

---

## System Context

```
You are implementing Step 3 of the Resume AI RAG project.
The scaffold, config, middleware, health endpoints, and EmbeddingService are in place.
Refer to `prompts/copilot_instructions.md` for architecture and standards.
```

---

## Task 1: Resume Types

Generate `src/types/resume.types.ts`:

```typescript
import { ObjectId } from 'mongodb';

export interface IResumeDocument {
  _id: ObjectId;
  text: string;
  embedding: number[];
  name: string;
  email: string;
  phone: string | null;
  location: string;
  company: string;
  role: string;
  education: string;
  total_Experience: number;
  relevant_Experience: number;
  skills: string;   // JSON-stringified array of skill strings
}

export interface ResumeSearchResult {
  resumeId: string;
  name: string;
  email: string;
  role: string;
  company: string;
  location: string;
  skills: string[];
  totalExperience: number;
  relevantExperience: number;
  education: string;
  snippet: string;          // Truncated text for display
  score?: number;           // BM25 or vector score
  searchType: 'bm25' | 'vector' | 'hybrid';
}

export interface SearchFilters {
  minYearsExperience?: number;
  maxYearsExperience?: number;
  skills?: string[];
  location?: string;
  role?: string;
}
```

---

## Task 2: Search Types

Generate `src/types/search.types.ts`:

```typescript
export interface SearchRequest {
  query: string;
  topK?: number;          // default 20
  filters?: SearchFilters;
}

export interface BM25SearchResponse {
  results: ResumeSearchResult[];
  total: number;
  durationMs: number;
}

export interface VectorSearchResponse {
  results: ResumeSearchResult[];
  total: number;
  durationMs: number;
}

export interface HybridSearchResponse {
  bm25Results: ResumeSearchResult[];
  vectorResults: ResumeSearchResult[];
  totalBM25: number;
  totalVector: number;
  durationMs: number;
}

export interface EndToEndSearchRequest extends SearchRequest {
  summarize?: boolean;
  summaryStyle?: 'short' | 'detailed';
  summaryMaxTokens?: number;
  rerankTopN?: number;
}

export interface EndToEndSearchResponse {
  results: RankedResumeResult[];
  meta: {
    query: string;
    totalCandidates: number;
    rerankTopN: number;
    durationMs: number;
    componentTimings: ComponentTimings;
    fallbacks: {
      vectorFallback: boolean;
      bm25Fallback: boolean;
      rerankFallback: boolean;
    };
  };
}

export interface RankedResumeResult extends ResumeSearchResult {
  rank: number;
  rerankScore?: number;
  summary?: string;
}
```

---

## Task 3: ResumeRepository

Generate `src/repositories/ResumeRepository.ts`:

### Requirements
- Constructor receives a `Db` (MongoDB native driver) instance.
- Methods:

#### `async bm25Search(query: string, filters: SearchFilters, topK: number): Promise<ResumeSearchResult[]>`
- Build an Atlas Search aggregation pipeline using `$search` with the `text` operator.
- Search across fields: `text`, `skills`, `role`, `education`.
- Apply `$match` stage for filters (experience range, location, skills).
- Apply `$limit` with `topK`.
- Project only needed fields + `{ score: { $meta: "searchScore" } }`.
- Parse the `skills` field from JSON string to array.
- Return mapped `ResumeSearchResult[]`.

#### `async vectorSearch(embedding: number[], filters: SearchFilters, topK: number): Promise<ResumeSearchResult[]>`
- Build a `$vectorSearch` aggregation pipeline.
- Index name: `vector_index` (configurable).
- Path: `embedding`.
- `numCandidates`: `topK * 4` (over-fetch for ANN quality).
- `limit`: `topK`.
- Apply post-filter `$match` for filters.
- Project fields + `{ score: { $meta: "vectorSearchScore" } }`.
- Return mapped `ResumeSearchResult[]`.

#### `async findById(id: string): Promise<IResumeDocument | null>`

#### `async countDocuments(): Promise<number>`

### Helper
- Private method `mapToSearchResult(doc, searchType)` to standardise output.
- Truncate `text` to 500 chars for `snippet`.

---

## Task 4: BM25 Search Route

Generate / update `src/routes/search.routes.ts`:

### `POST /v1/search/bm25`

**Request Validation**:
```typescript
const bm25SearchSchema = z.object({
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(100).optional().default(20),
  filters: z.object({
    minYearsExperience: z.number().optional(),
    maxYearsExperience: z.number().optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
});
```

**Response** (200):
```json
{
  "results": [ { "resumeId": "...", "name": "...", "score": 5.23, ... } ],
  "total": 15,
  "durationMs": 312
}
```

---

## Task 5: Atlas Search Index Definition

Provide the JSON definition for the Atlas Search index that should be created on the `resumes` collection:

```json
{
  "name": "default",
  "mappings": {
    "dynamic": false,
    "fields": {
      "text": { "type": "string", "analyzer": "lucene.standard" },
      "skills": { "type": "string", "analyzer": "lucene.standard" },
      "role": { "type": "string", "analyzer": "lucene.standard" },
      "education": { "type": "string", "analyzer": "lucene.standard" },
      "location": { "type": "string", "analyzer": "lucene.keyword" },
      "total_Experience": { "type": "number" }
    }
  }
}
```

And the vector search index:
```json
{
  "name": "vector_index",
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

---

## Verification Checklist
- [ ] `ResumeRepository.bm25Search` returns results from MongoDB.
- [ ] `POST /v1/search/bm25` returns 200 with results array.
- [ ] Filters correctly narrow results (e.g., `minYearsExperience`).
- [ ] Empty query returns 400.
- [ ] Atlas Search index JSON is valid.
