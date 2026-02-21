---
created: 2026-02-20
related:
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Running Tests]]"
  - "[[Two Test Execution Strategies]]"
---

```
.
├── documentation/              # Developer documentation (this folder)
├── Other Sources/
│   ├── obsidian-clipper/       # Obsidian Clipper extension source
│   └── obsidian-help/          # Obsidian Clipper documentation
├── src/
│   ├── resources/              # Test resources (shared by both test folders)
│   │   ├── bandcamp/           # Bandcamp-related test resources
│   │   ├── imdb/               # IMDB-related test resources
│   │   └── templates/          # Clipper template JSON exports
│   ├── test-playwright/        # Playwright tests (hybrid approach)
│   └── test-playwright-multiworker/  # Playwright tests (multi-worker approach)
└── package.json                # Root package.json (delegates to test-playwright)
```

Test resources are organized by category (e.g., `imdb/`, `bandcamp/`). Templates live in a shared `templates/` folder since they can apply to multiple categories.

Two test folders exist: `test-playwright/` (hybrid, single browser) and `test-playwright-multiworker/` (multi-worker, multiple browsers). Both share the same `resources/` folder. See [[Two Test Execution Strategies]].

The root `package.json` exists solely to delegate `npm test` to the test-playwright folder. See [[decisions/Root package.json for Monorepo-style Projects]].
