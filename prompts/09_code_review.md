# Prompt 09 — Code Review & Refactoring

> **When to use**: When asking co-pilot to review existing code for quality,
> security, performance, or architectural compliance.

---

## System Context

```
You are a senior TypeScript code reviewer for the Resume AI RAG project.
Refer to `prompts/copilot_instructions.md` for architecture and standards.

Review code against these criteria (in priority order):
1. **Security** — no leaked secrets, no injection, no unsafe deserialization.
2. **Correctness** — logic errors, edge cases, off-by-one, null handling.
3. **Architecture** — layering violations, coupling, single responsibility.
4. **Error Handling** — uncaught promises, swallowed errors, missing fallbacks.
5. **Performance** — unnecessary allocations, N+1 queries, blocking operations.
6. **Type Safety** — use of `any`, missing generics, loose types.
7. **Maintainability** — naming, documentation, code duplication.

Output format:
- Severity: 🔴 Critical | 🟡 Warning | 🟢 Suggestion
- File & line reference.
- Issue description.
- Recommended fix (as a code diff).
```

---

## Review Prompt Template

```
Review the following file for quality, security, and architectural compliance:

File: <path>
```typescript
<paste code>
```

Provide findings in this format:
| # | Severity | Location | Issue | Fix |
|---|----------|----------|-------|-----|
| 1 | 🔴       | L23      | ...   | ... |
```

---

## Refactoring Prompts

### Extract Shared Logic
```
The following pattern is duplicated across multiple files:
<describe the pattern>

Files affected:
- <file1>
- <file2>

Extract this into a shared utility in `src/utils/` and update all consumers.
Provide the new utility file and diffs for each affected file.
```

### Improve Error Handling
```
Review all error handling in `src/services/` and ensure:
1. Every async function has proper try/catch.
2. Errors are wrapped in AppError with meaningful codes.
3. No errors are silently swallowed.
4. Fallback logic is implemented per the architecture doc.
5. All errors are logged before being thrown or handled.

Provide a file-by-file audit with fixes.
```

### Optimize Performance
```
Profile the end-to-end search pipeline and suggest optimizations:
1. Are BM25 and vector searches truly running in parallel?
2. Can we reduce the number of LLM calls (batch rerank)?
3. Are there unnecessary data transformations or copies?
4. Can we add caching for repeated queries?

Provide concrete code changes with expected impact.
```

### Security Hardening
```
Audit the project for security vulnerabilities:
1. Are API keys properly stored and never logged?
2. Is user input sanitized before MongoDB queries?
3. Are response payloads limited to prevent data leakage?
4. Is rate limiting implemented on public endpoints?
5. Are CORS headers properly configured?
6. Is the error handler leaking stack traces in production?

Provide findings and fixes.
```

---

*Use these prompts periodically — especially before shipping to production — to
catch issues that may have been introduced during rapid development.*
