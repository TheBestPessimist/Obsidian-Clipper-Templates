---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[Obsidian Web Clipper]]"
  - "[[Filters]]"
  - "[[tasks/2026-02-20 15-53 - Bandcamp Discography Template per-li HTML Pipeline]]"
---

Pattern for extracting clean text titles from HTML list items while removing images, then using them to build markdown links.

This is the pattern used for the Bandcamp discography template, but it can be reused for any site with list items that contain images + text.

**Problem:**
- HTML list items (`<li>`) contain both images and text.
- Directly converting the whole `<li>` with `|markdown` often creates multi-line link text and includes unwanted content.
- We only want a clean plain-text title to use inside `[title](url)`.

**Solution (per-li HTML + filters):**

1. Select the HTML of each list item:
   - `{% set itemsHtml = selectorHtml:OL_SELECTOR LI_SELECTOR %}`

2. Inside a loop, derive a clean title for each item:
   - `itemHtml | remove_html:"img" | markdown | strip_md | trim`
   - `remove_html:"img"` drops any image tags and their content.
   - `markdown` converts the remaining HTML to markdown.
   - `strip_md` removes markdown formatting (images, tables, emphasis) so only text remains.
   - `trim` cleans up leading/trailing whitespace.

3. If you also need URLs, use a **parallel selector** for links:
   - `{% set itemUrls = selector:OL_SELECTOR LI_SELECTOR a?href %}`
   - Then pair them with `itemUrls[loop.index0]` while looping over `itemsHtml` (see [[patterns/Clipper Parallel Array Iteration]]).

4. Build the final markdown link manually:
   - Example inside the loop:
     - `- [{{itemTitle}}]({{baseUrl}}{{itemUrls[loop.index0]}})`

This avoids relying on `markdown` to produce the exact link formatting and keeps links on a single line, which is important for tests that compare markdown line-by-line.

**When to use this pattern:**
- You need to:
  - operate on the full HTML of a repeated element (e.g. `<li>`),
  - remove specific HTML elements like images before conversion,
  - and end up with clean, one-line markdown links.
- Good fit for discography pages, article lists, or any site where each list item mixes an image with text and a link.

**Related:**
- [[Filters]] documentation for `remove_html`, `markdown`, and `strip_md`.
- [[patterns/Clipper Parallel Array Iteration]] for pairing names and URLs by index.

