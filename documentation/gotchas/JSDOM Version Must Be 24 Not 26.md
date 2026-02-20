---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[Clipper Template Test Harness]]"
  - "[[JSDOM]]"
  - "[[Defuddle]]"
---

[[Defuddle]], the library clipper uses for content extraction, has compatibility issues with [[JSDOM]] version 26. Using `jsdom@^26.0.0` causes type errors and runtime failures.

The fix is to use version 24:

```json
"jsdom": "^24.0.0"
```

This was discovered after seeing cryptic DOM interface errors during test runs.

