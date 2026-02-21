---
created: 2026-02-20
related:
  - "[[Clipper Template Test Harness]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[patterns/HAR Routing vs HTML Fixtures]]"
  - "[[patterns/Reusable HAR Test Helper]]"
  - "[[bugs/IMDB User Rating Not Captured in HAR]]"
  - "[[decisions/Separate Templates For Movies and Series]]"
  - "[[tasks/2026-02-20 13-45-51 - Extract Reusable HAR Test Helper]]"
---

Playwright tests using HAR file routing for IMDB movies. Currently tests "Another Earth (2011)" using a recorded HAR file.

**What worked:**
- `page.routeFromHAR()` replays network responses from the recorded HAR file
- Uses real IMDB URL (`https://www.imdb.com/title/tt1549572/`) instead of local fixture server
- Same embedded iframe approach as existing Andromeda test
- Template triggers on `schema:@Movie` instead of `schema:@TVSeries`
- Extracted common logic to `runHarTest()` helper — see [[patterns/Reusable HAR Test Helper]]

**What did NOT work:**
- User rating not captured — see [[bugs/IMDB User Rating Not Captured in HAR]]
- Schema only contains 3 actors while page shows 4 — see [[gotchas/Schema Data May Differ From Page Display]]

**Files:**
- `src/test-playwright/tests/imdb-har.spec.ts` — the test (uses `runHarTest()` helper)
- `src/resources/templates/imdb-movie-clipper.json` — movie template
- `src/resources/imdb/Another Earth (2011).md` — expected output
- `src/resources/imdb/imdb - Another Earth.har` — HAR recording

**Key insight:**
HAR files capture a snapshot of network state. Content loaded dynamically after page load (authenticated API calls, lazy-loaded data) may appear in loading states. Either wait longer when recording, or accept the limitation in expected output.
