---
created: 2026-02-20
related:
  - "[[tasks]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[patterns/Clipper Parallel Array Iteration]]"
  - "[[gotchas/Clipper For Loop Trims Whitespace]]"
  - "[[gotchas/Clipper Variable Name Collision With Preset]]"
  - "[[gotchas/Clipper Replace Filter Regex Escaping]]"
  - "[[Obsidian Web Clipper]]"
---

Created a [[Obsidian Web Clipper]] template to extract album/track listings from a [[Bandcamp]] artist page. Goal: nested markdown list with artist as parent and albums as indented children with links.

**Desired output format:**
```markdown
- [byron](https://byron.bandcamp.com/)
    - [Totul e sub control](https://byron.bandcamp.com/track/totul-e-sub-control)
    - [Efemeride](https://byron.bandcamp.com/album/efemeride)
```

**What worked:**

1. **Parallel array iteration with `loop.index0`** — See [[patterns/Clipper Parallel Array Iteration]]. Capture two arrays with `{% set %}`, iterate one, access the other by index.

2. **`selector:` returns arrays** — `{% set albumUrls = selector:ol.music-grid li.music-grid-item a?href %}` returns an array of all matching hrefs.

3. **`|trim` filter on loop items** — Each album title had leading/trailing whitespace from HTML. `{{albumTitle|trim}}` cleaned it up.

4. **`|slice:0,-1` for trailing slash** — URL was `https://byron.bandcamp.com/` and relative paths were `/track/...`. Used `{% set baseUrl = url|slice:0,-1 %}` to remove trailing slash, avoiding double slashes.

5. **`?href` attribute selector** — To get link href values, use `selector:a?href` syntax (question mark followed by attribute name).

**What did NOT work:**

1. **`|markdown` filter on HTML with whitespace** — The Bandcamp HTML had `<p class="title">\n\tAlbum Name\n\t</p>`. Using `selectorHtml|markdown` preserved this whitespace inside the link text, producing broken multi-line links like `[\n\tTitle\n\t](url)`.

2. **`|replace` with regex escapes** — Tried `|replace:"/\\n\\t/g":""` and `|replace:"\\n\\t":""` to remove `\n\t`. Neither worked. The clipper replace filter doesn't process regex escape sequences the way JavaScript does.

3. **`{{domain}}` for subdomain URL** — `{{domain}}` returns only `bandcamp.com`, not `byron.bandcamp.com`. Had to use `{{url}}` with `|slice` instead.

4. **Using `title` as loop variable** — `{% for title in titles %}` caused collision with the preset `{{title}}` variable. Renamed to `albumTitle`.

5. **Leading whitespace in for loops** — Template had `{% for %}    - [Title](url){% endfor %}` (4 spaces before dash). Output was `- [Title](url)` (no spaces). The renderer trims each loop iteration. See [[gotchas/Clipper For Loop Trims Whitespace]].

**Current state:**
Template extracts all 13 albums with correct titles and full URLs. The only remaining issue is the 4-space indentation being stripped by the renderer. This is a limitation in `renderer.ts` line 397: `results.push(itemResult.trim())`.

**Files created:**
- `src/resources/templates/bandcamp-discography-clipper.json` — the template
- `src/resources/bandcamp/byron - Discography.md` — expected output for tests
- `src/test-playwright/tests/bandcamp-har.spec.ts` — Playwright test
- `src/test-playwright/inspect-har.ts` — utility to open HAR files in browser for DOM inspection

**User feedback:**
- User liked creating a reusable utility (`inspect-har.ts`) to inspect HAR files in browser DevTools. This will be useful for future "make a template for X" requests.
- User will frequently request "make a template for X" — process should be easy to repeat.

