# Prompt 01 — Project Scaffold & Health Endpoints

> **When to use**: At the very start of the project to generate the initial codebase,
> TypeScript configuration, Express server, and health check endpoints.

---

## System Context

```
You are implementing Step 1 of the Resume AI RAG project.
Refer to `prompts/copilot_instructions.md` for the full architecture, coding standards,
and directory structure. All code must be TypeScript with strict mode.
```

---

## Task 1: Initialize Project

Generate the following configuration files:

### `package.json`
- Name: `resume-ai-rag`
- Scripts: `dev` (ts-node-dev), `build` (tsc), `start` (node dist/server.js), `test` (jest)
- Dependencies: `express`, `mongoose` (or `mongodb` native driver), `dotenv`, `pino`, `uuid`, `zod`, `axios`
- DevDependencies: `typescript`, `@types/express`, `@types/node`, `@types/uuid`, `ts-node-dev`, `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`

### `tsconfig.json`
- `strict: true`, `esModuleInterop: true`, `outDir: "./dist"`, `rootDir: "./src"`
- `target: "ES2022"`, `module: "commonjs"`, `resolveJsonModule: true`
- Include: `["src/**/*"]`, Exclude: `["node_modules", "dist", "src/tests"]`

### `.env.example`
- List all environment variables from the architecture doc with placeholder values.

### `.gitignore`
- `node_modules/`, `dist/`, `.env`, `*.log`

---

## Task 2: Config Loader

Generate `src/config/index.ts`:
- Load `.env` via `dotenv`.
- Export a frozen config object with typed fields for every env var.
- Throw on missing required vars (`MONGODB_URI`, `MISTRAL_API_KEY`, `GROQ_API_KEY`).

Generate `src/config/constants.ts`:
- `MAX_PAYLOAD_BYTES = 1_048_576`
- `DEFAULT_RERANK_TOP_N = 10`
- `DEFAULT_SEARCH_TOP_K = 20`
- `EMBEDDING_DIMENSIONS = 1024`
- `API_VERSION = 'v1'`

---

## Task 3: Express App Factory

Generate `src/app.ts`:
- Create and export an Express app.
- Apply middleware in order: `express.json({ limit })`, `requestId`, `requestLogger`, `routes`, `errorHandler`.
- Mount all routes under `/v1`.

Generate `src/server.ts`:
- Import app and config.
- Connect to MongoDB.
- Start HTTP server with graceful shutdown (`SIGTERM`, `SIGINT`).
- Log startup info (port, environment, DB status).

---

## Task 4: Health Endpoints

Generate `src/routes/health.routes.ts`:

### `GET /v1/health`
```json
{
  "status": "ok",
  "service": "resume-ai-rag",
  "version": "1.0.0",
  "uptime": 12345,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### `GET /v1/health/db`
- Ping MongoDB, measure latency.
```json
{
  "status": "connected",
  "latencyMs": 12,
  "database": "resumes_db"
}
```
- On failure: `{ "status": "disconnected", "error": "..." }`

---

## Task 5: Core Middleware

Generate these files in `src/middleware/`:

### `requestId.ts`
- Attach `req.requestId = uuid()` to every request.
- Set `X-Request-Id` response header.

### `requestLogger.ts`
- Log: `requestId`, `method`, `url`, `statusCode`, `durationMs`.
- Use `pino` for structured JSON output.

### `sizeLimit.ts`
- If `Content-Length` exceeds `MAX_PAYLOAD_BYTES`, return `413`.

### `errorHandler.ts`
- Catch all errors.
- If `AppError`: use its `statusCode` and `errorCode`.
- Otherwise: return `500` with generic message.
- Always log the full error with stack trace.

### `validateRequest.ts`
- Export a factory: `validateBody(schema: ZodSchema)` → middleware.
- On validation failure: return `400` with detailed field errors.

---

## Task 6: Shared Types

Generate `src/types/common.types.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode: string,
    public isOperational: boolean = true
  ) { super(message); }
}

export interface RequestWithId extends Request {
  requestId: string;
  componentTimings?: ComponentTimings;
}

export interface ComponentTimings {
  embeddingMs?: number;
  bm25Ms?: number;
  vectorMs?: number;
  rerankMs?: number;
  summarizeMs?: number;
}
```

---

## Verification Checklist
After generating all files:
- [ ] `npm install` completes without errors.
- [ ] `npm run dev` starts the server.
- [ ] `GET /v1/health` returns 200 with uptime.
- [ ] `GET /v1/health/db` returns MongoDB status.
- [ ] Oversized POST returns 413.
- [ ] Unknown route returns 404 with JSON error.
