---
created: 2026-02-20
related:
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/HAR Routing vs HTML Fixtures]]"
  - "[[bugs/IMDB User Rating Not Captured in HAR]]"
  - "[[decisions/Separate Templates For Movies and Series]]"
---

Added a Playwright test using HAR file routing instead of static HTML fixtures. Test clips "Another Earth (2011)" from IMDB.

**What worked:**
- `page.routeFromHAR()` replays network responses from the recorded HAR file
- Uses real IMDB URL (`https://www.imdb.com/title/tt1549572/`) instead of local fixture server
- Same embedded iframe approach as existing Andromeda test
- Template triggers on `schema:@Movie` instead of `schema:@TVSeries`

**What did NOT work:**
- User rating not captured — see [[bugs/IMDB User Rating Not Captured in HAR]]
- Schema only contains 3 actors while page shows 4 — see [[gotchas/Schema Actor Count Differs From Page Display]]

**Files created:**
- `src/test-playwright/tests/imdb-har.spec.ts` — the test
- `test resources/templates/imdb-movie-clipper.json` — movie template
- `test resources/Another Earth (2011).md` — expected output
- `test resources/www.imdb.com.har` — HAR recording (already existed)

**Key insight:**
HAR files capture a snapshot of network state. Content loaded dynamically after page load (authenticated API calls, lazy-loaded data) may appear in loading states. Either wait longer when recording, or accept the limitation in expected output.

