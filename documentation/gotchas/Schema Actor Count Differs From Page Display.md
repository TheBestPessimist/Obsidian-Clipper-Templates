---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[IMDB User Rating Not Captured in HAR]]"
  - "[[Obsidian Clipper]]"
---

The JSON-LD schema data on a page may contain fewer items than what's visually displayed.

**Example:** IMDB's "Another Earth" page shows 4 actors in the meta description ("Brit Marling, William Mapother, Matthew-Lee Erlbach, DJ Flava") but the `schema:actor` array only contains 3:

```json
"actor":[
  {"@type":"Person","name":"Brit Marling"},
  {"@type":"Person","name":"William Mapother"},
  {"@type":"Person","name":"Matthew-Lee Erlbach"}
]
```

"DJ Flava" appears in the page's meta description but not in the structured data.

**Implications:**
- Templates using `{{schema:actor[*].name|slice:0,5}}` will only get what's in the schema
- If you need all displayed actors, use CSS selectors instead of schema
- Expected test output must match what the schema actually provides, not what you see on the page

This is a data quality issue on the source website, not a clipper bug.

