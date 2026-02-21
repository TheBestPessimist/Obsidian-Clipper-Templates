---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Multi-worker Test Execution Strategy]]"
  - "[[Playwright]]"
  - "[[Running Tests]]"
---

Consolidated from two test execution strategies (hybrid and multi-worker) down to one (multi-worker only). Cleaned up naming and documentation.

**What we did:**

1. Removed "multiworker" naming from code since it's now the only approach:
   - `package.json`: renamed from `clipper-e2e-tests-multiworker` to `clipper-e2e-tests`
   - `fixtures.ts`: removed "MULTIWORKER APPROACH" section header
   - `imdb.spec.ts` and `bandcamp.spec.ts`: simplified comments

2. Renamed documentation:
   - `Two Test Execution Strategies.md` → `Multi-worker Test Execution Strategy.md`
   - Updated all `[[wikilinks]]` references to the new name

3. Updated documentation content:
   - `Running Tests.md`: removed dual approach explanation
   - `Project Structure.md`: removed reference to two test folders
   - `Parallel Test Execution Approaches.md`: marked hybrid as historical, added note about consolidation
   - `Clipper Active Tab Query Prevents True Parallelism.md`: simplified workaround list

4. Regenerated `package-lock.json` to reflect new package name

**Why consolidate:**
- Multi-worker is the correct approach according to [[Playwright]] best practices
- Having two approaches caused documentation sprawl and naming confusion
- Hybrid approach offered no significant advantage (was actually slightly slower)

**What worked:**
- Systematic search for all "multiworker", "multi-worker", "hybrid", and old doc references
- Updating wikilinks to maintain documentation cohesion

**What I liked:**
- Clean separation between "what was explored" (task doc) and "what we use now" (decision doc)
- The renamed `Multi-worker Test Execution Strategy.md` is more accurate and future-proof

