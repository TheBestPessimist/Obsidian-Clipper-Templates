---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[Obsidian Web Clipper]]"
---

The `|replace` filter in [[Obsidian Web Clipper]] does **not** process regex escape sequences the way JavaScript does.

**What doesn't work:**
```twig
{{value|replace:"/\\n\\t/g":""}}
{{value|replace:"\\n\\t":""}}
{{value|replace:"\n\t":""}}
```
None of these will match literal newline+tab characters in the string.

**What works:**
- Simple literal string replacement: `{{value|replace:"old":"new"}}`
- Regex patterns without special escapes: `{{value|replace:"/[abc]/g":"x"}}`

**The problem:**
When trying to remove `\n\t` (newline followed by tab) from HTML-derived content, the escape sequences are treated as literal backslash characters, not as newline/tab.

**Workaround:**
Avoid the need for complex regex by using different approaches:
1. Use `|trim` on individual values to remove leading/trailing whitespace
2. Use `selector:` instead of `selectorHtml:` to get text content without HTML whitespace
3. Process the data in a for loop with `|trim` on each item

**Example fix:**
Instead of:
```twig
{{selectorHtml:.title|markdown|replace:"\\n\\t":""}}
```
Use:
```twig
{% for item in selector:.title %}{{item|trim}}{% endfor %}
```

