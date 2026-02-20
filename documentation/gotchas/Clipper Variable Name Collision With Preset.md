---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[Obsidian Web Clipper]]"
---

Some variable names are **reserved as preset variables** in [[Obsidian Web Clipper]]. Using them as loop iterator names causes unexpected collisions.

**Problematic example:**
```twig
{% set titles = selector:.title %}
{% for title in titles %}
  {{title}}
{% endfor %}
```

The variable `title` conflicts with the preset `{{title}}` variable (the page title). The loop may not work as expected.

**Solution:**
Use a unique name that doesn't collide with presets:
```twig
{% set albumTitles = selector:.title %}
{% for albumTitle in albumTitles %}
  {{albumTitle}}
{% endfor %}
```

**Known preset variable names to avoid:**
- `title` — page title
- `url` — current page URL
- `domain` — page domain
- `date` — current date
- `time` — current time
- `author` — page author
- `description` — page meta description
- `content` — page content
- `fullHtml` — full page HTML
- `highlights` — user highlights

See [[Obsidian Web Clipper]] Variables documentation for full list.

**Tip:** Prefix your loop variables descriptively: `albumTitle`, `trackUrl`, `itemName` instead of generic `title`, `url`, `item`.

