---
created: 2026-02-20
related:
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Running Tests]]"
---

```
.
├── documentation/           # Developer documentation (this folder)
├── Other Sources/
│   ├── obsidian-clipper/    # Obsidian Clipper extension source
│   └── obsidian-help/       # Obsidian Clipper documentation
├── src/
│   ├── resources/           # Test resources (HAR files, templates, expected outputs)
│   │   ├── bandcamp/        # Bandcamp-related test resources
│   │   ├── imdb/            # IMDB-related test resources
│   │   └── templates/       # Clipper template JSON exports
│   └── test-playwright/     # Playwright E2E tests
└── package.json             # Root package.json (delegates to test-playwright)
```

Test resources are organized by category (e.g., `imdb/`, `bandcamp/`). Templates live in a shared `templates/` folder since they can apply to multiple categories.

The root `package.json` exists solely to delegate `npm test` to the test-playwright folder. See [[decisions/Root package.json for Monorepo-style Projects]].
