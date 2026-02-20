---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[IMDB User Rating Not Captured in HAR]]"
---

HAR files capture the network responses at recording time. Content loaded dynamically after page load may appear in a loading state.

**Example:** When recording an IMDB page, the "YOUR RATING" section shows `hero-rating-bar__loading` in the HTML. The actual user rating is fetched via a separate authenticated GraphQL API call that:
1. May not have completed when the initial HTML was captured
2. Requires authentication that's not replayed during HAR playback

**Signs this happened:**
- Elements show loading spinners or skeleton states in captured HTML
- `aria-label="Loading..."` attributes
- Missing data that should be present for logged-in users

**Workarounds:**
- Wait longer before stopping the HAR recording (let all content load)
- Manually edit the HAR file to include the missing response
- Accept that some dynamic content won't be captured and adjust expected output accordingly

In the [[IMDB User Rating Not Captured in HAR]] case, we accepted that the rating would be empty and updated the expected file.

