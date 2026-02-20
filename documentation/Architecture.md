---
created: 2026-02-20
tags:
  - test-harness
  - architecture
related:
  - "[[Test Harness Overview]]"
  - "[[Clipper Internals]]"
---

# Architecture

## Overview

The test harness imports the **real clipper modules** and only mocks what's necessary for Node.js/JSDOM execution.

## Key Components

### 1. JSDOM for DOM Parsing

We use [[JSDOM]] to parse HTML fixtures instead of a real browser:

```typescript
const dom = new JSDOM(html, { url });
const document = dom.window.document;
```

### 2. Defuddle for Content Extraction

[[Defuddle]] is the same library clipper uses to extract:
- Schema.org data (JSON-LD)
- Title, author, description
- Main content

```typescript
const defuddled = new Defuddle(document).parse();
```

### 3. Real Clipper Modules

We import directly from clipper source:

| Module | Purpose |
|--------|---------|
| `clipper/utils/renderer` | `render()` and `createSelectorResolver()` |
| `clipper/utils/filters` | Filter functions like `|slice`, `|wikilink` |
| `clipper/utils/obsidian-note-creator` | `generateFrontmatter()` |
| `clipper/utils/storage-utils` | `generalSettings` for property types |

### 4. Mock Selector Resolution

The clipper normally uses browser messaging to query CSS selectors. We replace this with JSDOM queries:

```typescript
const selectorResolver = createSelectorResolver((message) => {
  // Instead of browser.tabs.sendMessage, we query JSDOM directly
  return queryJsdom(dom.window.document, message);
});
```

## Data Flow

```
HTML Fixture
    ↓
JSDOM.parse()
    ↓
Defuddle.extract()
    ↓
clipper/renderer.render() with variables
    ↓
clipper/generateFrontmatter()
    ↓
Assembled Markdown
    ↓
Compare with Expected
```

## Vitest Configuration

Key settings in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    'clipper': path.resolve(clipperRoot, 'src'),
    'webextension-polyfill': path.resolve(clipperRoot, 'src/utils/__mocks__/webextension-polyfill.ts'),
  },
},
deps: {
  moduleDirectories: [
    'node_modules',
    path.resolve(clipperRoot, 'node_modules'),  // Use clipper's dependencies
  ],
},
```

## See Also

- [[Clipper Internals]] - Details about clipper's code structure
- [[Gotchas]] - Configuration issues we encountered

