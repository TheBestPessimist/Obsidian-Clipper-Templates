---
created: 2026-02-20
topics:
  - "[[Test Harness]]"
  - "[[Lessons Learned]]"
related:
  - "[[Test Harness Overview]]"
  - "[[What Worked]]"
---

# What Did Not Work

## 1. Reimplementing generateFrontmatter ❌

**Approach**: Write our own YAML frontmatter generator.

**Why it failed**: 
- The clipper's formatting is specific (quote escaping, list formatting)
- Any deviation means tests pass but real behavior differs
- **Tests become useless** if they don't match real clipper behavior

**Lesson**: NEVER reimplement clipper functions. Always import the real ones.

## 2. Reimplementing formatPropertyValue ❌

**Approach**: Write our own property value formatter.

**Why it failed**: Same as above. The clipper has specific rules for:
- `multitext` → YAML list with quoted items
- `number` → unquoted numeric value
- `date` → unquoted date string
- `text` → quoted string

**Lesson**: Import, don't reimplement.

## 3. Complex Per-Property Assertions ❌

**Approach**: Test each property individually with separate assertions.

```typescript
// Too verbose and hard to maintain
expect(result.properties[0].value).toBe('...');
expect(result.properties[1].value).toBe('...');
```

**Why it failed**: 
- Ugly and difficult to read
- Hard to see what the full output looks like
- Doesn't test frontmatter formatting

**Solution**: Single comparison of full markdown output.

## 4. JSDOM v26 ❌

**Approach**: Use latest JSDOM version.

**Why it failed**: Defuddle library has compatibility issues with JSDOM v26.

**Error**: Type errors and runtime issues with DOM interfaces.

**Solution**: Downgrade to `jsdom@^24.0.0`.

## 5. Missing webextension-polyfill Alias ❌

**Approach**: Assume Vitest would resolve browser extension imports.

**Why it failed**: `webextension-polyfill` is a browser extension package that doesn't work in Node.js.

**Error**: `Failed to resolve import "webextension-polyfill"`

**Solution**: Alias to clipper's existing mock file.

## 6. Missing Clipper's node_modules ❌

**Approach**: Only use test-harness's own `node_modules`.

**Why it failed**: Clipper imports dependencies like `dayjs` that weren't in our `node_modules`.

**Error**: `Failed to resolve import "dayjs"`

**Solution**: Add clipper's `node_modules` to `moduleDirectories`.

## See Also

- [[What Worked]] - Successful approaches
- [[Gotchas]] - Common pitfalls
