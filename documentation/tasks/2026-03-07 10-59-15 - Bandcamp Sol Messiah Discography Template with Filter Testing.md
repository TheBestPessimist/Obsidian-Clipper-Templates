---
created: 2026-03-07
related:
	  - "[[tasks]]"
---

Bandcamp Sol Messiah discography template and tests, updated to keep album title and artist together in a single-line task while following [[guide/Developing New Templates with Filter Testing]].

**What we tried and did work**

- Used a dedicated Bandcamp filter test in `src/test-playwright/tests/standalone filters.spec.ts` with HAR `bandcamp/solmessiah.bandcamp.com.har` and `runFilterTestsAndAssert` to iterate on the album-title extraction without touching template JSON.
- Switched from selecting the whole `li.music-grid-item` HTML to just `p.title` with:
  - `selectorHtml:ol.music-grid li.music-grid-item p.title`.
- In the filter test and then in `bandcamp-discography-as-tasks-clipper.json`, derived `albumName` via:
  - `titleHtml|replace:"<br>":" — "|markdown|strip_md|trim`.
  This replaced the `<br>` between album title and artist with a literal em dash before markdown conversion, then stripped markdown and whitespace, giving a stable one-line `Album — Artist` string.
- Kept URLs and titles aligned using the existing [[patterns/Clipper Parallel Array Iteration]] pattern:
  - `albumUrls = selector:ol.music-grid li.music-grid-item a?href`
  - `albumTitleHtmls = selectorHtml:... p.title`
  - In the loop, used `albumUrls[loop.index0]` to pair each `albumName` with its URL.
- Verified behavior incrementally:
  - Ran the standalone filter tests.
  - Ran only the Bandcamp Playwright tests.
  - Ran the full `npm run test` suite from the repo root; all 7 tests passed.

**What we tried and did NOT work**

- Operating on full `li.music-grid-item` HTML with:
  - `liHtml|remove_html:"img"|markdown|strip_md|trim`
  and then trying to repair the resulting newlines inside the album title/artist text using:
  - `replace:"\n":" — "` or combinations of `split` + `join`.
  Symptoms:
  - Turndown’s list handling plus the `<br>` inside `p.title` produced embedded newlines and indentation.
  - When that text was placed inside `[{{albumName}}](...)`, the Markdown link label broke across multiple lines.
- Complex `replace` chains inside `noteContentFormat` to normalize whitespace and punctuation around the em dash, especially once JSON escaping for `\n` and `\"` got involved. Even when the text looked almost right, the test output diverged due to subtle spacing/newline differences, and the template became hard to read and maintain.
- Treating this as a pure "fix it after markdown" problem instead of adjusting the HTML selection and structure *before* `markdown` ran. The successful solution was to simplify the HTML input and replace `<br>` up front.

**Things liked**

- The [[patterns/Filter Testing Pattern]] + [[guide/Developing New Templates with Filter Testing]] workflow worked very well:
  - Quick iteration on filters using HAR + Playwright, with immediate visibility into what each filter returned.
  - Reduced trial-and-error inside template JSON, and less risk of breaking imports via bad escaping.
- Narrowing the selector to `p.title` and handling `<br>` explicitly made the pipeline simpler to reason about and more robust across different Bandcamp entries, while still preserving the artist name.
- Reusing the existing "discography as tasks" structure (base URL slicing, parallel arrays for titles and URLs, task syntax) meant Byron and Sol Messiah could share the same template behavior.

**Things disliked**

- Fragility of complex filter expressions when embedded inside JSON `noteContentFormat`, especially when `replace` involves escaped characters like `\n` or regex-style syntax. One typo or mis-escape can break template import or subtly change output.
- How easily Turndown’s list rules and Bandcamp’s `<br>` structure combined to create multi-line link text, even though the goal was a simple `Album — Artist` string.
- The need to reason about multiple layers at once (HTML structure, markdown conversion, markdown stripping, and manual link construction) to understand why a simple-looking template produced split link labels.

**Gotchas / knowledge captured elsewhere**

- The specific issue of list-item HTML and Bandcamp’s `<br>` generating multi-line album links is captured in [[gotchas/Clipper LI-based Markdown Can Produce Multiline Links]].
- For earlier Byron-only work and the original per-`li` pipeline, see:
  - [[2026-02-20 15-03 - Bandcamp Discography Template]]
  - [[2026-02-20 15-53 - Bandcamp Discography Template per-li HTML Pipeline]]

**Documentation updated in this task**

- [[patterns/Filter Testing Pattern]]
- [[gotchas/Clipper LI-based Markdown Can Produce Multiline Links]]
