---
created: 2026-02-20
topics:
  - "[[Testing]]"
  - "[[Lessons Learned]]"
related:
  - "[[Clipper Template Test Harness]]"
  - "[[Why Reimplementing Clipper Functions Breaks Tests]]"
---

An early approach tested each property individually:

```typescript
expect(result.properties[0].value).toBe('Andromeda (2000)');
expect(result.properties[1].value).toBe('...');
// ... many more assertions
```

This was ugly and hard to maintain. You couldn't see the full output at a glance. It didn't test frontmatter formatting. Adding a property required adding more assertions.

The better approach is a single comparison of the complete markdown output:

```typescript
const actual = await evaluateTemplate(html, template, options);
expect(actual).toBe(expected);
```

When a test fails, the diff shows exactly what changed. The expected file serves as documentation of the correct output. Adding properties requires no test code changes—just update the expected file.

