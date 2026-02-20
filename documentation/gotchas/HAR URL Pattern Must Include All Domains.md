---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[bugs/IMDB User Rating Not Captured in HAR]]"
  - "[[Playwright]]"
---

When using `page.routeFromHAR()`, the `url` parameter filters which requests are served from the HAR. If the filter is too narrow, API calls to subdomains or other domains won't be replayed.

Modern websites load data from multiple domains. IMDB for example uses:
- `www.imdb.com` — main HTML
- `api.graphql.imdb.com` — user data, ratings, watchlist status
- `m.media-amazon.com` — images
- `dqpnq362acqdi.cloudfront.net` — JavaScript bundles

A pattern like `**/www.imdb.com/**` only matches the first domain. GraphQL API calls to `api.graphql.imdb.com` fall through to the network where they fail (no cookies/auth).

**Fix:** Remove the URL filter entirely to replay ALL recorded requests:
```typescript
await page.routeFromHAR(HAR_PATH, {
  notFound: 'fallback',  // No url filter
});
```

Or use a broader pattern:
```typescript
await page.routeFromHAR(HAR_PATH, {
  url: '**/*.imdb.com/**',  // Matches subdomains
  notFound: 'fallback',
});
```

The safest approach is no URL filter — let Playwright match everything in the HAR and fall back to network only for requests not recorded.

