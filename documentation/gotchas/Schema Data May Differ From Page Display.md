---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[IMDB User Rating Not Captured in HAR]]"
  - "[[Obsidian Clipper]]"
  - "[[IMDB]]"
---

The JSON-LD schema data on a page may contain fewer items than what's visually displayed. This applies to actors, genres, and other schema properties.

**Actor Example:** IMDB's "Another Earth" page shows 4 actors in the meta description ("Brit Marling, William Mapother, Matthew-Lee Erlbach, DJ Flava") but the `schema:actor` array only contains 3. "DJ Flava" appears in the page's meta description but not in the structured data.

**Genre Example:** IMDB's "Shogun (1980)" page shows interest chips for Period Drama, War Epic, Adventure, Drama, History, War - but `schema:genre` only contains Adventure, Drama, History. The additional genre classifications exist only in the visual "interest chips" (`span.ipc-chip__text`).

**Implications:**
- Templates using `{{schema:actor[*].name}}` or `{{schema:genre}}` only get what's in the schema
- If you need all displayed items, use CSS selectors instead of schema
- The interest chips (`span.ipc-chip__text`) on IMDB include ALL genres (schema + additional)
- Expected test output must match what the template actually extracts

This is a data quality issue on the source website, not a clipper bug. Sometimes CSS selectors are better than schema for completeness.
