---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[Clipper Template Test Harness]]"
---

Templates using `{{date}}` produce different output each day. Pass a fixed date for reproducible tests:

```typescript
await evaluateTemplate(html, template, {
  url: 'https://example.com',
  date: new Date('2026-02-20'),
});
```

Without a fixed date, tests fail the next day.

