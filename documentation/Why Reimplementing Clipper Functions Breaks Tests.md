---
created: 2026-02-20
topics:
  - "[[Obsidian Clipper]]"
  - "[[Testing]]"
  - "[[Lessons Learned]]"
related:
  - "[[Clipper Template Test Harness]]"
  - "[[Import Real Clipper Modules Do Not Reimplement]]"
---

During development, `generateFrontmatter` and `formatPropertyValue` were reimplemented instead of imported from clipper. This was a critical mistake that makes tests useless.

The clipper has very specific formatting rules:
- `multitext` properties become YAML lists with `- "item"` syntax
- Quotes inside values are escaped with `escapeDoubleQuotes()`
- Numbers are unquoted
- Dates are unquoted
- Empty values produce just `propertyname:` with no trailing space

A reimplementation might get 90% of this right, but the 10% difference means tests can pass while the real extension behaves differently. The tests become worthless for catching regressions.

The solution was to delete all reimplemented code and import directly:

```typescript
import { generateFrontmatter } from 'clipper/utils/obsidian-note-creator';
```

This required understanding [[Clipper generateFrontmatter Uses generalSettings Not Property Type]] to set up the property types correctly.

