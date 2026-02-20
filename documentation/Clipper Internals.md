---
created: 2026-02-20
topics:
  - "[[Test Harness]]"
  - "[[Obsidian Clipper]]"
related:
  - "[[Architecture]]"
  - "[[Gotchas]]"
---

# Clipper Internals

Knowledge discovered about the [[Obsidian Clipper]] codebase while building the test harness.

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/renderer.ts` | Template variable rendering with `render()` |
| `src/utils/filters.ts` | Filter implementations (`\|slice`, `\|wikilink`, etc.) |
| `src/utils/obsidian-note-creator.ts` | `generateFrontmatter()` for YAML output |
| `src/utils/storage-utils.ts` | `generalSettings` singleton with `propertyTypes` |
| `src/utils/content-extractor.ts` | Page content extraction using Defuddle |
| `src/types/types.ts` | TypeScript interfaces (`Template`, `Property`, etc.) |
| `src/utils/__mocks__/webextension-polyfill.ts` | Mock for browser extension APIs |

## Variable Resolution

Template variables like `{{title}}` or `{{schema:@TVSeries:name}}` are resolved in `renderer.ts`:

1. **Simple variables**: `{{title}}`, `{{url}}`, `{{date}}`
2. **Schema variables**: `{{schema:@Type:property}}`
3. **Selector variables**: `{{selector:CSS_SELECTOR}}` - requires browser messaging
4. **Meta variables**: `{{meta:name}}` for `<meta>` tags

## Filter System

Filters are applied with `|`:
- `{{title|slice:0,4}}` - substring
- `{{author|wikilink}}` - wrap in `[[]]`
- `{{genres|split:,|wikilink|join:, }}` - chain multiple

Implemented in `filters.ts` with `applyFilters()`.

## Frontmatter Generation

`generateFrontmatter(properties: Property[])` in `obsidian-note-creator.ts`:

1. Looks up each property's type from `generalSettings.propertyTypes`
2. Formats based on type:
   - `multitext` → YAML list with `- "item"` syntax
   - `number` → unquoted numeric
   - `date` → unquoted date string
   - `text` → quoted string

## Selector Resolution

`createSelectorResolver(sendMessage)` in `renderer.ts`:

- Creates a resolver function that queries DOM via messaging
- In browser: uses `browser.tabs.sendMessage`
- In tests: we provide JSDOM-based queries

## The generalSettings Singleton

`generalSettings` in `storage-utils.ts` is a module-level object:

```typescript
export let generalSettings: Settings = {
  propertyTypes: [],
  // ... other settings
};
```

This means we can mutate it before calling clipper functions to inject test configuration.

## Defuddle Integration

Clipper uses [[Defuddle]] for content extraction:
- JSON-LD schema parsing
- Meta tag extraction  
- Main content identification
- Readability processing

## Template Structure

```typescript
interface Template {
  name: string;
  behavior: 'create' | 'append-daily' | ...;
  noteNameFormat: string;
  noteContentFormat: string;
  properties: Property[];
  triggers?: string[];
}

interface Property {
  name: string;
  value: string;   // Template string like "{{title}}"
  type?: string;   // 'text' | 'multitext' | 'number' | 'date'
}
```

## See Also

- [[Architecture]] - How the test harness uses these
- [[Gotchas]] - Pitfalls related to internals
