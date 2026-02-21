---
created: 2026-02-21
related:
  - "[[decisions]]"
  - "[[Playwright]]"
  - "[[Clipper Active Tab Query Prevents True Parallelism]]"
  - "[[Running Tests]]"
---

Two test execution strategies exist side-by-side for comparison:

**Option A: Multi-worker** in `src/test-playwright-multiworker/`
- [[Playwright]] config: `workers: 4` (Playwright may use fewer based on test count and CPU cores)
- Each worker spawns its own browser with the extension loaded
- Templates loaded once per worker (worker-scoped fixtures)
- Each test is a separate test case (allows distribution across workers)
- Tests run truly in parallel
- Downloads go to per-worker directories to avoid conflicts

**Option B: Hybrid** in `src/test-playwright/`
- [[Playwright]] config: `workers: 1`
- Single browser instance shared across all tests
- Templates loaded once at startup
- Tests grouped by domain (e.g., "All IMDB tests")
- Phase 1: Load all pages in parallel (parallelized network I/O)
- Phase 2: Run clipper sequentially (avoids active-tab race condition)

**Trade-offs:**

| Aspect | Multi-worker | Hybrid |
|--------|--------------|--------|
| Speed (4 tests) | 27.7s | 30.9s |
| Memory | Higher (multiple browsers) | Lower (single browser) |
| Template loading | Once per worker | Once total |
| Test isolation | Better (process isolation) | Shared state possible |
| Scalability | Scales with more workers | Limited by sequential clipping |
| Debugging | Harder (multiple browsers) | Easier (single browser) |

**Why keep both:** Multi-worker is the recommended approach for CI/large test suites. Hybrid is useful for development/debugging with `headless: false` where having multiple browser windows is distracting.

**Test structure difference:**
Multi-worker uses individual test cases so [[Playwright]] can distribute them:
```typescript
test('Another Earth (Movie)', async ({ context, extensionId }) => {
  const actual = await runHarTest(context, extensionId, {...});
  expectEqualsIgnoringNewlines(actual, expected);
});
```

Hybrid batches tests together:
```typescript
test('All IMDB tests (parallel)', async ({ context, extensionId }) => {
  const results = await runHarTestsInParallel(context, extensionId, [...]);
  expectAllParallelTestsPassed(results);
});
```
