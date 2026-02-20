---
created: 2026-02-20
related:
  - "[[bugs]]"
  - "[[gotchas/HAR URL Pattern Must Include All Domains]]"
  - "[[guide/Playwright Tests With HAR Files]]"
---

When replaying the IMDB HAR file, the user's personal rating (8) was not appearing in the clipped output even though the HAR contained the rating data.

**Symptoms:**
- The `rating:` field in clipped output was empty
- HAR file definitely contained the rating data (searched and found GraphQL response with rating)
- CSS selector for rating matched no element during replay

**Root cause:**
The `routeFromHAR` call used a URL filter that was too narrow:
```typescript
await page.routeFromHAR(HAR_PATH, {
  url: '**/www.imdb.com/**',  // Only matches www.imdb.com
  notFound: 'fallback',
});
```

The user rating is loaded via GraphQL from `api.graphql.imdb.com` (specifically the `PersonalizedTitlesData` query). This domain did NOT match the `**/www.imdb.com/**` pattern, so Playwright fell back to the network (which failed because no session/cookies).

**Resolution:**
Remove the URL filter to replay ALL recorded requests:
```typescript
await page.routeFromHAR(HAR_PATH, {
  notFound: 'fallback',  // No url filter = match all recorded requests
});
```

The test now correctly captures the user rating of "8" from the HAR replay. See [[gotchas/HAR URL Pattern Must Include All Domains]].
