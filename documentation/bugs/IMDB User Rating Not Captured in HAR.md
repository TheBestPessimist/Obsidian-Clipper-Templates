---
created: 2026-02-20
related:
  - "[[bugs]]"
  - "[[gotchas/HAR Files May Not Capture Dynamic Content]]"
  - "[[guide/Playwright Tests With HAR Files]]"
---

When recording the IMDB page for "Another Earth (2011)", the user's personal rating was not captured in the HAR file.

**Symptoms:**
- The `rating:` field in clipped output is empty
- HAR file contains `hero-rating-bar__loading` in the HTML
- CSS selector for rating matches no element

**Investigation:**
- Searched HAR for `ratingValue` — found `ratingValue\":8` but this was inside a review object (a reviewer's rating), not the user's personal rating
- Searched for `YOUR RATING` — found the section but it shows `aria-label=\"Loading rating\"` and `aria-disabled=\"true\"`
- Found 88 GraphQL requests in HAR but none contained the user's rating data

**Root cause:**
The user's personal rating is fetched via an authenticated GraphQL API call that either:
1. Hadn't completed when the HAR was recorded
2. Requires authentication cookies that weren't present during HAR playback

**Resolution:**
Accepted the limitation. Updated expected file `Another Earth (2011).md` to have empty `rating:` field.

**Future fix:**
Re-record the HAR while logged in, wait for page to fully load (rating spinner disappears), then stop recording.

