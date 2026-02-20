---
created: 2026-02-20
related:
  - "[[tasks]]"
  - "[[patterns/Clipper Per-LI HTML Remove Images And Markdown Titles]]"
  - "[[gotchas/Clipper For Loop Trims Whitespace]]"
  - "[[Obsidian Web Clipper]]"
  - "[[2026-02-20 15-03 - Bandcamp Discography Template]]"
---

Follow-up work on the [[Bandcamp]] discography template to respect the "per-li HTML" pipeline and document indentation limitations.

User requirement for template behavior (recap):
- For every HTML `li` entry in the album list
  - remove the HTML of the image
  - convert the remaining HTML to markdown
- All steps should be implemented with Web Clipper filters (no external post-processing).

**New template approach (per-li HTML pipeline):**
- Switched from relying only on `selector:` text for titles to using `selectorHtml` on the full list items:
  - `{% set albumLisHtml = selectorHtml:ol.music-grid li.music-grid-item %}`
- For each `liHtml` we derive a clean album name with:
  - `liHtml | remove_html:"img" | markdown | strip_md | trim`
  - `remove_html:"img"` drops any `<img>` tags inside the list item at the HTML level.
  - `markdown` converts the cleaned HTML to markdown.
  - `strip_md` removes markdown formatting so we get plain text titles.
  - `trim` cleans up whitespace.
- URLs are taken from a parallel selector:
  - `{% set albumUrls = selector:ol.music-grid li.music-grid-item a?href %}`
  - We pair name + URL via `albumUrls[loop.index0]` while looping `for liHtml in albumLisHtml`.
- We build the final markdown ourselves instead of trusting `markdown` to generate links:
  - First line: `- [{{meta:property:og:title}}]({{url}})`
  - Then for each album: `- [{{albumName}}]({{baseUrl}}{{albumUrls[loop.index0]}})` where `baseUrl = url|slice:0,-1`.

**What worked in this round:**
- Using `selectorHtml` + `remove_html:"img"` ensured images are completely removed before markdown conversion.
- `markdown | strip_md | trim` produced stable, plain-text album titles, avoiding multi-line link text.
- Pairing `albumLisHtml` with `albumUrls` via `loop.index0` followed the existing [[patterns/Clipper Parallel Array Iteration]].
- Keeping manual control over the `- [name](url)` markup avoided surprises from `markdown` formatting.
- HAR-based Playwright test `bandcamp-har.spec.ts` passed again after this change:
  - Command: `npm test -- bandcamp-har.spec.ts` from `src/test-playwright`.
  - Output matches `src/resources/bandcamp/byron - Discography.md` (flat list, no images).

**What did not work / dead ends this time:**
- Using `selectorHtml` directly on `p.title a` for both names and URLs produced an empty result under HAR; switching to `li.music-grid-item` HTML for names and `li.music-grid-item a?href` for URLs fixed it.
- Letting `markdown` output the whole list item and trying to keep its link formatting led to multi-line links and brittle output.
- Trying to repair `markdown` output with complex `|replace` expressions inside `noteContentFormat` quickly ran into JSON escaping problems, making the template hard to import/debug. The per-li name pipeline + manual link syntax is much more robust.

**Indentation attempt (4 spaces) and limitation:**
- Goal: render albums as a sublist under the band line:
  - `- [byron](...)`
  - `    - [Album 1](...)`
- The existing [[gotchas/Clipper For Loop Trims Whitespace]] behavior blocks this:
  - Each `{% for %}` iteration output is trimmed via `results.push(itemResult.trim())` in `renderer.ts`.
  - Any leading spaces inside the loop body (e.g. `    - [{{albumName}}](...)`) are stripped.
- The documented workaround (`items|join:"\n    - "`) only applies if you already have a simple array of strings. Here we need loop logic to pair album names and URLs and to build `[name](url)` strings, so we cannot easily `join` afterward.
- Conclusion: with the current engine and documented features, we accept a **flat list** of bullets (no 4-space indentation) from the template and keep nested indentation as a post-processing concern if ever needed.

**Things I liked / disliked:**
- Liked:
  - The `remove_html` + `markdown` + `strip_md` pipeline is powerful and predictable for pulling clean text out of messy HTML.
  - Manual `[name](url)` construction gives precise control over one-line links, which plays well with HAR tests that compare line-by-line.
- Disliked:
  - For-loop whitespace trimming makes it impossible to express nested, indented lists cleanly from within the template.
  - Escaping complex `replace` expressions inside JSON `noteContentFormat` is fragile and easy to break; better to avoid when possible.

**Relevant files for this task:**
- `src/resources/templates/bandcamp-discography-clipper.json` — final per-li HTML template using `remove_html`, `markdown`, `strip_md`, and parallel array iteration for URLs.
- `src/resources/bandcamp/byron - Discography.md` — expected flat bullet list used by tests (no images, no nested indentation).
- `src/resources/bandcamp/byron.bandcamp.com.har` — HAR input for the Bandcamp artist page.
- `src/test-playwright/tests/bandcamp-har.spec.ts` — HAR-based Playwright test that validates the template via the real extension UI.

