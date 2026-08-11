# Co-pilot Master Instructions — Resume AI RAG Project

> **Usage**: Feed this file (or reference it) in the co-pilot side-chat as the system prompt.
> It establishes the project context, architecture, coding standards, and behavioral rules
> that every generated file must follow.

---

## 1. Project Identity

| Field              | Value                                                                      |
|--------------------|----------------------------------------------------------------------------|
| **Project Name**   | Resume AI RAG Search API                                                   |
| **Runtime**        | Node.js 20+ (LTS)                                                         |
| **Language**       | TypeScript 5.x, strict mode                                               |
| **Framework**      | Express 4.x                                                               |
| **Database**       | MongoDB Atlas (BM25 via Atlas Search, Vector via Atlas Vector Search)      |
| **Embeddings**     | Mistral API (`mistral-embed`, 1024 dimensions)                            |
| **LLM**           | Groq API (`meta-llama/llama-4-scout-17b-16e-instruct`)                    |
| **API Versioning** | URL-based (`/v1/...`)                                                     |
| **Deployment**     | Single-node monolith, vertically scaled                                   |
| **Latency Target** | P95 ≤ 3–5 seconds for end-to-end search                                  |

---

## 2. Directory Structure (Mandatory)

```
src/
├── app.ts                    # Express app factory (middleware + routes)
├── server.ts                 # HTTP server bootstrap + graceful shutdown
├── config/
│   ├── index.ts              # Centralised config loader (env + defaults)
│   └── constants.ts          # Magic numbers, limits, model defaults
├── routes/
│   ├── index.ts              # Route aggregator
│   ├── health.routes.ts      # GET /v1/health, GET /v1/health/db
│   ├── embedding.routes.ts   # POST /v1/embeddings
│   └── search.routes.ts      # POST /v1/search/*
├── services/
│   ├── EmbeddingService.ts   # Mistral embedding wrapper
│   ├── LLMService.ts         # Groq LLM (rerank, summarise, extract)
│   ├── SearchService.ts      # BM25, vector, hybrid, end-to-end
│   └── LoggingService.ts     # Structured JSON logger
├── repositories/
│   └── ResumeRepository.ts   # MongoDB CRUD, BM25 queries, vector queries
├── middleware/
│   ├── requestId.ts          # UUID per request
│   ├── requestLogger.ts      # Structured access log
│   ├── sizeLimit.ts          # Payload size guard (413)
│   ├── errorHandler.ts       # Global error → JSON response
│   └── validateRequest.ts    # Joi / Zod schema validation
├── types/
│   ├── resume.types.ts       # Resume document interface
│   ├── search.types.ts       # Search request/response DTOs
│   ├── embedding.types.ts    # Embedding request/response DTOs
│   └── common.types.ts       # Shared (RequestWithId, AppError, etc.)
├── utils/
│   ├── timer.ts              # Precision timing helper
│   └── retry.ts              # Exponential back-off wrapper
└── tests/
    ├── unit/                 # Jest unit tests per service
    └── integration/          # Supertest integration tests per route
```

---

## 3. Coding Standards

### 3.1 TypeScript Rules
- Enable `strict: true` in `tsconfig.json`.
- Prefer `interface` over `type` for object shapes.
- No `any` — use `unknown` and narrow with type guards.
- Export named exports only (no default exports).

### 3.2 Naming Conventions
| Element        | Convention           | Example                        |
|----------------|----------------------|--------------------------------|
| Classes        | PascalCase           | `SearchService`                |
| Interfaces     | PascalCase, `I` prefix optional | `IResumeDocument`    |
| Functions      | camelCase            | `rerankCandidates`             |
| Variables      | camelCase            | `queryEmbedding`               |
| Constants      | UPPER_SNAKE_CASE     | `MAX_PAYLOAD_BYTES`            |
| Files          | camelCase or PascalCase matching export | `SearchService.ts` |
| Env vars       | UPPER_SNAKE_CASE     | `MISTRAL_API_KEY`              |

### 3.3 Error Handling
- Define a custom `AppError` class with `statusCode`, `errorCode`, and `isOperational`.
- Throw `AppError` in services; catch in `errorHandler` middleware.
- Never swallow errors silently — always log before returning a fallback.

### 3.4 Logging
- Use `pino` (or `winston`) with JSON output.
- Every log entry must include: `requestId`, `timestamp`, `level`, `message`.
- Component timings object: `{ embeddingMs, bm25Ms, vectorMs, rerankMs, summarizeMs }`.

### 3.5 Environment Variables
All secrets and tunables live in `.env` and are loaded via `dotenv`:
```
PORT=3000
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=resumes_db
MISTRAL_API_KEY=
MISTRAL_EMBED_MODEL=mistral-embed
MISTRAL_EMBED_DIMENSIONS=1024
GROQ_API_KEY=
GROQ_LLM_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
RERANK_TOP_N=10
MAX_PAYLOAD_BYTES=1048576
LOG_LEVEL=info
```

---

## 4. Architecture Rules (Non-Negotiable)

1. **Layered architecture** — routes call services, services call repositories. Never access DB from routes.
2. **Dependency injection** — pass service instances via constructor or factory; avoid global singletons for testability.
3. **Synchronous pipeline** — the end-to-end search flow is sequential: embed → BM25 → vector → merge → rerank → summarise → respond.
4. **Parallel where safe** — BM25 and vector search run in `Promise.all` inside `hybridSearch`.
5. **Fallback chain** — if rerank fails → use hybrid order (BM25 priority). If vector fails → BM25 only (`vectorFallback: true`). If BM25 fails → vector only (`bm25Fallback: true`).
6. **No score merging** — BM25 and vector return independent lists; the LLM is the sole re-ranking authority.

---

## 5. Behavioral Rules for Co-pilot

1. **Always produce complete files** with all imports, types, and exports — never partial snippets.
2. **Place files in the correct directory** per the structure above.
3. **Include JSDoc** on every exported function and class.
4. **Add inline comments** only for non-obvious logic (e.g., fallback decisions, scoring).
5. **Never hardcode** API keys, URLs, or magic numbers — use `config`.
6. **Return only code blocks** unless the user explicitly asks for explanation.
7. **When editing existing code**, show the exact file path and use diff format to highlight changes.
8. **When debugging**, include the error message, root cause analysis, and the fix — all in structured format.

---

## 6. Endpoints Summary

| #  | Method | Path                  | Purpose                                     |
|----|--------|-----------------------|---------------------------------------------|
| 1  | GET    | `/v1/health`          | App status, version, uptime                 |
| 2  | GET    | `/v1/health/db`       | MongoDB ping + latency                      |
| 3  | POST   | `/v1/embeddings`      | Generate embedding for input text            |
| 4  | POST   | `/v1/search/bm25`     | BM25 full-text search                       |
| 5  | POST   | `/v1/search/vector`   | Vector similarity search                    |
| 6  | POST   | `/v1/search/hybrid`   | Parallel BM25 + vector (debug/explore)      |
| 7  | POST   | `/v1/search/rerank`   | LLM re-ranking of candidate list            |
| 8  | POST   | `/v1/search/summarize`| LLM fitness summary for a candidate         |
| 9  | POST   | `/v1/search`          | Full end-to-end RAG pipeline                |

---

## 7. Data Model Reference (MongoDB `resumes` collection)

```typescript
interface IResumeDocument {
  _id: ObjectId;
  text: string;                  // Full resume text
  embedding: number[];           // 1024-dim Mistral embedding
  name: string;
  email: string;
  phone: string | null;
  location: string;
  company: string;
  role: string;
  education: string;
  total_Experience: number;
  relevant_Experience: number;
  skills: string;                // JSON-stringified array
}
```

---

*Reference this file at the start of every co-pilot session to maintain consistency.*
