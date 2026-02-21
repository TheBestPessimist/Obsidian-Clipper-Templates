---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[Playwright]]"
  - "[[Multi-worker Test Execution Strategy]]"
  - "[[Playwright Built-in Fixture Names]]"
---

[[Playwright]] worker fixtures run once per worker, not once per test. They're declared with `{ scope: 'worker' }`.

Use worker fixtures for expensive setup that should be shared across tests in the same worker:
- Browser context with extension loaded
- Template imports
- Per-worker download directories

Access worker info via the third parameter:
```typescript
extensionContext: [async ({}, use, workerInfo) => {
  // workerInfo.workerIndex - unique worker number (0, 1, 2...)
  // workerInfo.project.use - access config's "use" options
  const headless = workerInfo.project.use.headless ?? true;
  const downloadsPath = `downloads/worker-${workerInfo.workerIndex}`;
  // ...
}, { scope: 'worker' }],
```

Worker fixtures guarantee single execution per worker, so manual "loaded" flags are unnecessary. If you find yourself writing `let loaded = false; if (!loaded) { ... loaded = true; }`, you likely want a worker fixture instead.

Worker fixtures can depend on other worker fixtures:
```typescript
extensionId: [async ({ extensionContext }, use) => {
  // extensionContext is guaranteed to exist
  const sw = extensionContext.serviceWorkers()[0];
  // ...
}, { scope: 'worker' }],
```

See also [[Playwright Built-in Fixture Names]] for naming constraints.

