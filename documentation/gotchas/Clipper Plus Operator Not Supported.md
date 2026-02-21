---
created: 2026-02-21
related:
  - "[[gotchas]]"
  - "[[Obsidian Clipper]]"
---

The [[Obsidian Clipper]] template language does **not** support the `+` operator for string/array concatenation:

```
{% set a = schema:genre %}
{% set b = selector:span.ipc-chip__text %}
{% set combined = a + b %}  {# FAILS - produces empty output #}
```

The renderer's binary expression evaluator only supports comparison (`==`, `!=`, `>`, `<`, `>=`, `<=`), logical (`and`, `or`, `contains`), and nullish coalescing (`??`) operators.

**Use `|merge` instead:**

```
{% set aa = schema:genre %}
{% set bb = selector:span.ipc-chip__text %}
{{aa|merge:bb|unique|wikilink|join}}
```

Or chain directly without variables:
```
{{schema:genre|merge:selector:span.ipc-chip__text|unique|wikilink|join}}
```

Static strings use parentheses: `"a"|merge:("b","c")` → `["a","b","c"]`
