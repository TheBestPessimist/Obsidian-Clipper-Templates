---
created: 2026-03-07
related:
	  - "[[gotchas]]"
---

**Summary**

When you feed full `li` HTML (or other list-structured markup) into the Clipper `markdown` / `markdown|strip_md` pipeline and then reuse the result inside a *new* manual Markdown link like `[{{albumName}}](url)`, Turndown’s list rules can introduce embedded newlines and indentation. That turns what should be a single-line link label into multi-line Markdown.

**Example (Bandcamp Sol Messiah)**

Bandcamp discography entries use HTML like:

- `ol.music-grid li.music-grid-item`
- Inside each `li`, a `p.title` with a `<br>` separating album title and artist override:
  - `ASTRAL CHRONICLE<br><span class="artist-override">SA-ROC</span>`

Early attempts used:

- `albumLisHtml = selectorHtml:ol.music-grid li.music-grid-item`
- `albumName = liHtml|remove_html:"img"|markdown|strip_md|trim`

This produced text containing a newline between title and artist. When plugged into:

- `- [ ] ttt [{{albumName}}]({{baseUrl}}{{albumUrls[loop.index0]}}) ...`

the output became something like:

- First line: `- [ ] ttt [ASTRAL CHRONICLE`
- Second line: `SA-ROC](https://.../astral-chronicle) ➕ 2026-02-20`

Visually the content looked right, but the Markdown link label was split across lines, and tests comparing against single-line expectations failed.

**Mitigation / preferred approach**

- Avoid running `markdown` on entire `li` elements when you intend to reuse the resulting text inside another manually constructed list.
- Instead, narrow the selector to the element that actually contains the label text (for Bandcamp: `p.title`).
- Replace structural HTML like `<br>` with your desired separator *before* markdown conversion:
  - `titleHtml|replace:"<br>":" — "|markdown|strip_md|trim`
- Then inject `albumName` into your manual link:
  - `- [ ] ttt [{{albumName}}]({{baseUrl}}{{albumUrls[loop.index0]}}) ➕ {{date|date:"YYYY-MM-DD"}}`

This keeps Turndown’s list handling from polluting your label text with extra newlines/indentation and preserves `Album — Artist` on a single line.

**Where this showed up**

- Original per-`li` pipeline for Bandcamp is documented in [[2026-02-20 15-53 - Bandcamp Discography Template per-li HTML Pipeline]].
- The final, working approach using `p.title` and `<br>` replacement is recorded in [[2026-03-07 10-59-15 - Bandcamp Sol Messiah Discography Template with Filter Testing]].
