---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[Obsidian Web Clipper]]"
  - "[[Clipper Source Code Key Files]]"
  - "[[patterns/Clipper Parallel Array Iteration]]"
---

The `{% for %}` loop in [[Obsidian Web Clipper]] templates **trims each iteration result**. Leading and trailing whitespace is stripped from each loop item.

**Why this happens:**
In `renderer.ts` line 397:
```typescript
results.push(itemResult.trim());
```
Then line 404:
```typescript
return results.join('\n');
```

Each loop iteration's output is trimmed before being pushed to results, then joined with newlines.

**Example that fails:**
```twig
{% for item in items %}    - {{item}}
{% endfor %}
```
Expected: 4-space indented list items
Actual: No indentation (spaces stripped)

**Workarounds:**

1. **Accept flat lists** — If the for loop is the top-level structure, the items won't be indented. Structure your template around this.

2. **Use `|join` with custom separator** — If you can build an array of formatted strings first:
```twig
{{items|join:"\n    - "}}
```
This joins items with newline + 4 spaces + dash.

3. **Post-process outside clipper** — Accept the unindented output and fix indentation in Obsidian via search/replace or a plugin.

**Source file:** `Other Sources/obsidian-clipper/src/utils/renderer.ts`

