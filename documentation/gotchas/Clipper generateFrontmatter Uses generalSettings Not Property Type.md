---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[Clipper Template Test Harness]]"
  - "[[decisions/Import Real Clipper Modules Do Not Reimplement]]"
  - "[[Clipper Source Code Key Files]]"
---

The `Property` interface in clipper has an optional `type?: string` field. You might expect `generateFrontmatter` to use this. It does not.

Instead, `generateFrontmatter` in `obsidian-note-creator.ts` looks up the type from a global singleton:

```typescript
const propertyType = generalSettings.propertyTypes.find(p => p.name === property.name)?.type || 'text';
```

Before calling `generateFrontmatter`, populate `generalSettings.propertyTypes` with the property types from your template:

```typescript
import { generalSettings } from 'clipper/utils/storage-utils';

generalSettings.propertyTypes = template.properties.map(p => ({
  name: p.name,
  type: p.type || 'text',
}));

const frontmatter = await generateFrontmatter(properties);
```

Without this setup, all properties default to `text` type and formatting will be wrong (numbers will be quoted, lists will be strings, etc).

