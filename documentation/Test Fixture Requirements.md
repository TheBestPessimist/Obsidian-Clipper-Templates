---
created: 2026-02-20
topics:
  - "[[Testing]]"
  - "[[Gotchas]]"
related:
  - "[[Adding New Template Tests]]"
  - "[[Clipper Template Test Harness]]"
---

Expected markdown files must end with exactly one newline character. Inconsistent line endings cause test failures with cryptic diffs.

The URL passed to `evaluateTemplate` matters. It affects `{{url}}`, `{{domain}}`, and relative link resolution. Always use the real URL of the original page.

Templates using `{{date}}` produce different output each day. Pass a fixed date for reproducible tests:

```typescript
await evaluateTemplate(html, template, {
  url: 'https://example.com',
  date: new Date('2026-02-20'),
});
```

Template content often starts with `\n` in the `noteContentFormat`. The harness handles this by removing one leading newline to avoid double blank lines between frontmatter and content.

The clipper source at `Other Sources/obsidian-clipper` must exist. The test harness imports directly from it.

