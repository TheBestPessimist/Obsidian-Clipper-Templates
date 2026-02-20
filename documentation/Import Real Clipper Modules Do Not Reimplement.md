---
created: 2026-02-20
topics:
  - "[[Obsidian Clipper]]"
  - "[[Testing]]"
  - "[[Lessons Learned]]"
related:
  - "[[Clipper Template Test Harness]]"
  - "[[Why Reimplementing Clipper Functions Breaks Tests]]"
  - "[[Clipper generateFrontmatter Uses generalSettings Not Property Type]]"
---

The test harness imports actual clipper functions instead of reimplementing them. This is the most important design decision.

```typescript
import { render, createSelectorResolver } from 'clipper/utils/renderer';
import { generateFrontmatter } from 'clipper/utils/obsidian-note-creator';
import { generalSettings } from 'clipper/utils/storage-utils';
```

This works because:
- Tests validate the real behavior, not a copy of it
- No drift between test code and production code  
- Frontmatter formatting matches exactly what the extension produces
- When clipper updates, tests automatically use the new behavior

The clipper source is at `Other Sources/obsidian-clipper/src`. The [[Vitest]] config aliases `clipper` to this path:

```typescript
resolve: {
  alias: {
    'clipper': path.resolve(clipperRoot, 'src'),
  },
}
```

The only things we mock are browser extension APIs (using clipper's own mock at `src/utils/__mocks__/webextension-polyfill.ts`) and CSS selector resolution (using [[JSDOM]] queries instead of browser messaging).

