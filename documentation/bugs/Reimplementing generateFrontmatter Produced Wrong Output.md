---
created: 2026-02-20
related:
  - "[[bugs]]"
  - "[[Clipper Template Test Harness]]"
  - "[[decisions/Import Real Clipper Modules Do Not Reimplement]]"
---

During development, `generateFrontmatter` and `formatPropertyValue` were reimplemented instead of imported from clipper. This was a critical mistake.

The clipper has very specific formatting rules:
- `multitext` properties become YAML lists with `- "item"` syntax
- Quotes inside values are escaped with `escapeDoubleQuotes()`
- Numbers are unquoted
- Dates are unquoted
- Empty values produce just `propertyname:` with no trailing space

The reimplementation got most of this right but not all. Tests passed while the real extension behaved differently. The tests became useless for catching regressions.

The fix was to delete all reimplemented code and import directly:

```typescript
import { generateFrontmatter } from 'clipper/utils/obsidian-note-creator';
```

This required understanding [[gotchas/Clipper generateFrontmatter Uses generalSettings Not Property Type]] to set up property types correctly.

