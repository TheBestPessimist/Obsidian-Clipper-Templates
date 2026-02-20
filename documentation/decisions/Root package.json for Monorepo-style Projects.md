---
created: 2026-02-20
related:
  - "[[decisions]]"
  - "[[guide/Running Tests]]"
  - "[[npm]]"
---

Use a root `package.json` that delegates commands to subdirectory packages via `--prefix`.

```json
{
  "scripts": {
    "test": "npm test --prefix src/test-playwright"
  }
}
```

This allows running `npm test` from the project root without needing to `cd` into a subdirectory.

**Why this matters:**
- Most developers expect `npm test` to work from the root
- CI/CD pipelines typically run from the repository root
- It's less typing and easier to remember

**Alternative rejected:** Using npm workspaces. The project structure doesn't warrant full workspace setup since there's only one testable package.

