---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Obsidian Clipper]]"
  - "[[IMDB]]"
  - "[[imdb-series-clipper.json]]"
  - "[[Clipper Plus Operator Not Supported]]"
  - "[[Clipper Set Then Iterate Breaks With Filters]]"
  - "[[IMDB Creators vs Stars Selector]]"
  - "[[Schema Data May Differ From Page Display]]"
---

**Problem:** The IMDB series template was clipping incorrectly for "Shogun (1980)":
1. **Writers field** was populated with actors instead of being empty (Shogun has no creators/writers listed)
2. **Genres field** was missing genres - expected 6 genres but only got 3 from schema

**Root Causes:**

*Writers issue:* The selector used `li:nth-child(1)` which grabbed the first list item regardless of content. For Andromeda, that's "Creators". For Shogun, there's no Creators section - only "Stars" - so it grabbed actors instead.

*Genres issue:* The template used `schema:genre` which only returns 3 genres (Adventure, Drama, History). The additional genres (Period Drama, War Epic, War) exist only in IMDB's "interest chips" on the page (`span.ipc-chip__text`), not in schema.org data.

**What Worked:**

For writers: Changed selector from `li:nth-child(1)` to `li:has(> span.ipc-metadata-list-item__label)`. This works because:
- Creators sections use `<span class="ipc-metadata-list-item__label">` for the label
- Stars sections use `<a class="ipc-metadata-list-item__label">` (an anchor, not span)
- The `:has()` pseudo-class with direct child `>` selector targets only Creators

For genres: Changed from `{{schema:genre|wikilink|join}}` to iterating over interest chips:
```
{% for i in selector:span.ipc-chip__text %}{% if i != "Back to top" %}[[{{i}}]], {% endif %}{% endfor %}
```
The interest chips already include all genres (schema + additional) so no need to combine sources.

**What Did NOT Work:**

1. **The `+` operator** - tried `{% set combined = a + b %}` but the Clipper renderer doesn't support `+`. See [[Clipper Plus Operator Not Supported]].

2. **Set variable with filters, then iterate** - tried `{% set interests = selector:...|slice:0,-1 %}{% for i in interests %}` but this produced empty output. See [[Clipper Set Then Iterate Breaks With Filters]].

**Better approach we could have used:**

Use `|merge:` to combine arrays with `{% set %}` variables:
```
{% set aa = schema:genre %}
{% set bb = selector:span.ipc-chip__text %}
{{aa|merge:bb|unique|wikilink|join}}
```
Or chain directly: `{{schema:genre|merge:selector:span.ipc-chip__text|unique|wikilink|join}}`

We went with the for-loop approach since the interest chips already contain all genres, but `|merge:` with `|unique` would have been cleaner.

**Files Changed:**
- `src/resources/templates/imdb-series-clipper.json` - Fixed writers selector and genre template
- `src/resources/imdb/Andromeda (2000).md` - Updated expected genres to include interest chips (Space Sci-Fi, Sci-Fi)

**Key Learning:** The interest chips (`span.ipc-chip__text`) on IMDB pages include ALL genres - both the ones from schema and additional classification terms. Using just the interest chips is simpler than trying to combine schema + interests.
