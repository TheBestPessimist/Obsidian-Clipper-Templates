---
created: 2026-02-20
topics:
  - "[[Vitest]]"
  - "[[Gotchas]]"
related:
  - "[[Vitest Config for Clipper Test Harness]]"
  - "[[Clipper Template Test Harness]]"
---

When clipper code imports dependencies like `dayjs`, Vitest looks in the test harness's `node_modules` by default. If those dependencies aren't installed there, imports fail with "Failed to resolve import".

Rather than duplicating all clipper dependencies in the test harness, add clipper's `node_modules` to the module resolution path:

```typescript
deps: {
  moduleDirectories: [
    'node_modules',
    path.resolve(clipperRoot, 'node_modules'),
  ],
},
```

This tells Vitest to look in both `test-harness/node_modules` and `Other Sources/obsidian-clipper/node_modules` when resolving imports.

This approach keeps the test harness lean and ensures version consistency with the clipper's actual dependencies.

