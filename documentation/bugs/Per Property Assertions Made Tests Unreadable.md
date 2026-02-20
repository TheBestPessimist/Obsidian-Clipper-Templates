---
created: 2026-02-20
related:
  - "[[bugs]]"
  - "[[Clipper Template Test Harness]]"
  - "[[patterns/Single Assertion Against Expected File]]"
---

An early approach tested each property individually:

```typescript
expect(result.properties[0].value).toBe('Andromeda (2000)');
expect(result.properties[1].value).toBe('...');
// ... many more assertions
```

This was ugly and hard to maintain. You couldn't see the full output at a glance. It didn't test frontmatter formatting. Adding a property required adding more assertions.

The fix was [[patterns/Single Assertion Against Expected File]].

