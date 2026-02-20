---
created: 2026-02-20
related:
  - "[[decisions]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[Obsidian Clipper]]"
---

IMDB has different schema types for movies (`@Movie`) and TV series (`@TVSeries`). We maintain separate templates:

- `imdb-series-clipper.json` — triggers on `schema:@TVSeries`
- `imdb-movie-clipper.json` — triggers on `schema:@Movie`

**Why not one template?**

The templates have different field mappings:
- Movies use `{{schema:@Movie:name}}` for title
- Series use `{{schema:@TVSeries:name}}` for title
- Movies have `directors` from schema; series often don't
- The CSS selectors for writers differ between page layouts

**Alternative considered:**

Could use schema shorthand `{{schema:name}}` which would resolve to either type. But the `noteNameFormat` still needs the specific type to build the filename correctly. Cleaner to have separate templates that match their triggers exactly.

