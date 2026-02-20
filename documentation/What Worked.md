---
created: 2026-02-20
topics:
  - "[[Test Harness]]"
  - "[[Lessons Learned]]"
related:
  - "[[Test Harness Overview]]"
  - "[[What Did Not Work]]"
---

# What Worked

## 1. Using Real Clipper Modules ✅

**Approach**: Import actual clipper functions instead of reimplementing them.

**Why it worked**: 
- Tests validate real behavior
- No drift between test and production code
- Frontmatter formatting matches exactly

**Key imports**:
```typescript
import { render, createSelectorResolver } from 'clipper/utils/renderer';
import { generateFrontmatter } from 'clipper/utils/obsidian-note-creator';
import { generalSettings } from 'clipper/utils/storage-utils';
```

## 2. Aliasing webextension-polyfill ✅

**Approach**: Point to clipper's existing mock instead of creating our own.

```typescript
// vitest.config.ts
alias: {
  'webextension-polyfill': path.resolve(clipperRoot, 'src/utils/__mocks__/webextension-polyfill.ts'),
}
```

**Why it worked**: Clipper already has a mock for testing. Reusing it means less maintenance.

## 3. Using Clipper's node_modules ✅

**Approach**: Add clipper's `node_modules` to module directories.

```typescript
deps: {
  moduleDirectories: [
    'node_modules',
    path.resolve(clipperRoot, 'node_modules'),
  ],
}
```

**Why it worked**: Avoids version mismatches for shared dependencies like `dayjs`.

## 4. JSDOM for Selector Resolution ✅

**Approach**: Replace browser message passing with direct JSDOM queries.

**Why it worked**: 
- `createSelectorResolver` accepts a `sendMessage` function parameter
- We provide a JSDOM-based implementation
- Same interface, different transport

## 5. Setting generalSettings.propertyTypes ✅

**Approach**: Before calling `generateFrontmatter`, populate `generalSettings.propertyTypes` from template.

```typescript
generalSettings.propertyTypes = template.properties.map(p => ({
  name: p.name,
  type: p.type || 'text',
}));
```

**Why it worked**: The real `generateFrontmatter` uses this to determine how to format each property (multitext, number, date, etc.).

## 6. Downgrading JSDOM to v24 ✅

**Problem**: JSDOM v26 conflicted with Defuddle.

**Solution**: Use `jsdom@^24.0.0` to match what Defuddle expects.

**Why it worked**: Defuddle has peer dependency issues with newer JSDOM versions.

## See Also

- [[What Did Not Work]] - Approaches that failed
- [[Gotchas]] - Common pitfalls
