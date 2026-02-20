---
created: 2026-02-20
related:
  - "[[Obsidian Clipper]]"
  - "[[Clipper Source Code Key Files]]"
  - "[[Clipper Template Test Harness]]"
---

Template variables like `{{title}}` or `{{schema:@TVSeries:name}}` are resolved by the `render()` function in `renderer.ts`.

Simple variables — `{{title}}`, `{{url}}`, `{{date}}`, `{{author}}`, `{{description}}` — come directly from the extracted page content.

Schema variables — `{{schema:@TVSeries:name}}` — query JSON-LD structured data embedded in the page. [[Defuddle]] extracts this.

Selector variables — `{{selector:CSS_SELECTOR}}` — query the DOM using CSS selectors. In the browser, this uses messaging to the content script. In tests, we replace this with [[JSDOM]] queries.

Meta variables — `{{meta:og:image}}` — read `<meta>` tag values from the page.

Filters are applied with `|`: `{{title|slice:0,4}}` takes the first 4 characters. `{{author|wikilink}}` wraps in `[[]]`. Filters chain: `{{genres|split:,|wikilink|join:, }}`.

