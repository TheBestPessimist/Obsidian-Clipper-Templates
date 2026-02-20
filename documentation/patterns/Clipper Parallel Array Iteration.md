---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[Obsidian Web Clipper]]"
  - "[[gotchas/Clipper For Loop Trims Whitespace]]"
  - "[[gotchas/Clipper Variable Name Collision With Preset]]"
---

When you need to iterate over **two parallel arrays** (e.g., URLs and titles that correspond by index), use `{% set %}` to capture both arrays, then iterate one while accessing the other by index using `loop.index0`.

**Pattern:**
```twig
{% set urls = selector:.item a?href %}
{% set titles = selector:.item .title %}
{% for itemTitle in titles %}
- [{{itemTitle|trim}}]({{urls[loop.index0]}})
{% endfor %}
```

**How it works:**
1. `{% set urls = selector:... %}` captures an array of href values
2. `{% set titles = selector:... %}` captures an array of title text
3. `{% for itemTitle in titles %}` iterates over titles
4. `loop.index0` gives the 0-based index (0, 1, 2, ...)
5. `urls[loop.index0]` accesses the corresponding URL at the same index

**Loop variables available:**
| Variable | Description |
|----------|-------------|
| `loop.index` | Current iteration (1-indexed: 1, 2, 3...) |
| `loop.index0` | Current iteration (0-indexed: 0, 1, 2...) |
| `loop.first` | `true` if first iteration |
| `loop.last` | `true` if last iteration |
| `loop.length` | Total number of items |

**Why not use `selectorHtml` + `|markdown`?**
HTML often contains whitespace (`\n`, `\t`) inside elements. When converted with `|markdown`, this whitespace appears inside link text, creating broken multi-line links. Iterating with `selector:` and `|trim` avoids this.

**Combining with base URL:**
If the selector returns relative paths, combine with the page URL:
```twig
{% set baseUrl = url|slice:0,-1 %}
{% for itemTitle in titles %}
- [{{itemTitle|trim}}]({{baseUrl}}{{urls[loop.index0]}})
{% endfor %}
```

The `|slice:0,-1` removes the trailing slash from `https://example.com/` to avoid double slashes when concatenating with `/path`.

**Limitation:**
See [[gotchas/Clipper For Loop Trims Whitespace]] — leading whitespace (indentation) inside loop iterations is stripped.

