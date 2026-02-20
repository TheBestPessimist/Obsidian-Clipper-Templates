---
created: 2026-02-20
tags:
  - test-harness
  - gotchas
  - warnings
related:
  - "[[Test Harness Overview]]"
  - "[[What Did Not Work]]"
---

# Gotchas

## 1. Property Types Come From generalSettings, Not Property

The clipper's `generateFrontmatter` looks up property types from `generalSettings.propertyTypes`, **not** from `property.type`:

```typescript
// In obsidian-note-creator.ts
const propertyType = generalSettings.propertyTypes.find(p => p.name === property.name)?.type || 'text';
```

**Solution**: Set `generalSettings.propertyTypes` before calling `generateFrontmatter`:

```typescript
generalSettings.propertyTypes = template.properties.map(p => ({
  name: p.name,
  type: p.type || 'text',
}));
```

## 2. Frontmatter Ends With `---\n`

The real `generateFrontmatter` returns a string ending with `---\n`. You need to add an extra newline before content:

```typescript
const markdown = frontmatter + '\n' + content + '\n';
```

## 3. Template Content May Start With Newline

Many templates have `noteContentFormat` starting with `\n`. Handle this to avoid double blank lines:

```typescript
const content = result.content.startsWith('\n')
  ? result.content.slice(1)
  : result.content;
```

## 4. Date Must Be Fixed for Reproducible Tests

Templates use `{{date}}` which defaults to "now". For reproducible tests, fix the date:

```typescript
await evaluateTemplate(html, template, {
  url: 'https://example.com',
  date: new Date('2026-02-20'),
});
```

## 5. URL Affects Extraction

The URL is used for:
- Relative link resolution
- Domain extraction (`{{domain}}`)
- URL variable (`{{url}}`)

Always provide the real URL that matches how the page was originally clipped.

## 6. JSDOM Version Must Be 24.x

Defuddle doesn't work with JSDOM v26. Use:

```json
"jsdom": "^24.0.0"
```

## 7. Clipper Source Must Be Present

The test harness imports from `Other Sources/obsidian-clipper/src`. This directory must exist and contain the clipper source code.

## 8. Trailing Newline in Expected Files

Make sure your expected `.md` files end with exactly one newline. Inconsistent line endings will cause test failures.

## 9. Don't Modify Clipper Source

The clipper source is outside your control. Treat it as read-only. If clipper changes behavior, update your expected files, not the clipper.

## See Also

- [[How to Add Tests]] - Step-by-step guide
- [[Clipper Internals]] - Understanding clipper's code

