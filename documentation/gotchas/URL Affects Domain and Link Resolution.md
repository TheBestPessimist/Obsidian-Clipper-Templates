---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[Clipper Template Test Harness]]"
---

The URL passed to `evaluateTemplate` matters. It affects `{{url}}`, `{{domain}}`, and relative link resolution. Always use the real URL of the original page:

```typescript
await evaluateTemplate(html, template, {
  url: 'https://www.imdb.com/title/tt0213327/',
  date: new Date('2026-02-20'),
});
```

Using `https://example.com` when the fixture is from IMDB will produce wrong values for domain-related variables.

