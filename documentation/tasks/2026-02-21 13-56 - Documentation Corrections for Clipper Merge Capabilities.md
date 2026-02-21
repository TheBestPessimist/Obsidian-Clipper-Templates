---
created: 2026-02-21
related:
  - "[[tasks]]"
  - "[[Obsidian Clipper]]"
  - "[[Clipper Plus Operator Not Supported]]"
  - "[[2026-02-21 13-39 - Fix IMDB Series Template Writers and Genres]]"
---

**Problem:** During documentation of the IMDB template fixes, I incorrectly documented that Clipper cannot combine dynamic variables. The user corrected me through several iterations.

**My incorrect assumptions:**

1. Initially claimed `|merge` only accepts static string parameters like `|merge:("c","d")`
2. Then claimed `|merge:variableName` doesn't work with `{% set %}` variables
3. Documented workarounds that weren't necessary

**What the user taught me:**

The `|merge` filter is quite flexible:

1. **Static strings** use parentheses: `"a"|merge:("b","c")` → `["a","b","c"]`

2. **Dynamic references** chain directly: `|merge:schema:actor[*].name`

3. **`{% set %}` variables** work with `|merge:variableName`:
```
{% set aa = schema:genre %}
{% set bb = selector:span.ipc-chip__text %}
{{aa|merge:bb|unique|wikilink|join}}
```

**Files corrected:**

- Renamed gotcha file twice:
  - `Clipper No String Concatenation in Expressions.md` → `Clipper Cannot Combine Dynamic Variables.md` → `Clipper Plus Operator Not Supported.md`
- The final name accurately reflects the only real limitation: the `+` operator isn't supported

- Updated `[[2026-02-21 13-39 - Fix IMDB Series Template Writers and Genres]]` with correct `|merge:` patterns

- Updated `[[Clipper Set Then Iterate Breaks With Filters]]` references

**Key takeaway:** The `+` operator is not supported, but `|merge:variableName` works perfectly for combining arrays. Always test assumptions before documenting them.

