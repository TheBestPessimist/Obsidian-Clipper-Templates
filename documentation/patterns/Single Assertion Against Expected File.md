---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[Clipper Template Test Harness]]"
  - "[[bugs/Per Property Assertions Made Tests Unreadable]]"
  - "[[guide/Adding New Template Tests]]"
---

Compare the complete markdown output against an expected file in a single assertion:

```typescript
const actual = await evaluateTemplate(html, template, options);
expect(actual).toBe(expected);
```

When a test fails, the diff shows exactly what changed. The expected file serves as documentation of the correct output. Adding properties requires no test code changes—just update the expected file.

This pattern is cleaner than many small assertions and tests the full output including frontmatter formatting.

