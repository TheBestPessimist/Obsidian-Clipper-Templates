---
created: 2026-02-21
related:
  - "[[patterns]]"
  - "[[IMDB]]"
  - "[[Obsidian Clipper]]"
  - "[[imdb-series-clipper.json]]"
---

IMDB series pages have a metadata section that may contain "Creators" (writers) and/or "Stars" (actors). Not all pages have both - some series only show Stars.

**HTML Structure Difference:**
- **Creators** uses a `<span>` for the label:
  ```html
  <li>
    <span class="ipc-metadata-list-item__label">Creators</span>
    <div><ul><li>Name 1</li><li>Name 2</li></ul></div>
  </li>
  ```
- **Stars** uses an `<a>` (anchor) for the label:
  ```html
  <li>
    <a class="ipc-metadata-list-item__label" href="...">Stars</a>
    <div><ul><li>Name 1</li><li>Name 2</li></ul></div>
  </li>
  ```

**Selector to get only Creators (writers):**
```css
li:has(> span.ipc-metadata-list-item__label) > div > ul > li
```

The `:has(> span...)` pseudo-class with direct child selector `>` ensures we only match `<li>` elements where the label is a `<span>` (Creators), not an `<a>` (Stars).

**Why `li:nth-child(1)` fails:** If a page only has Stars (no Creators), the Stars section becomes the first child, and `li:nth-child(1)` incorrectly captures actors as writers.

**Example:**
- Andromeda (2000): Has Creators → selector works, returns Gene Roddenberry, Robert Hewitt Wolfe
- Shogun (1980): No Creators section → selector returns empty (correct)

