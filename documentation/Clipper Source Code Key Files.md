---
created: 2026-02-20
related:
  - "[[Obsidian Clipper]]"
  - "[[Clipper Template Test Harness]]"
  - "[[gotchas/Clipper generateFrontmatter Uses generalSettings Not Property Type]]"
  - "[[How Clipper Resolves Template Variables]]"
---

`src/utils/renderer.ts` — The `render()` function resolves template variables. The `createSelectorResolver()` function creates a resolver that queries the DOM via browser messaging (or our [[JSDOM]] replacement).

`src/utils/filters.ts` — Filter implementations for `|slice`, `|wikilink`, `|split`, `|join`, and others. The `applyFilters()` function chains them.

`src/utils/obsidian-note-creator.ts` — The `generateFrontmatter()` function produces YAML from properties. Uses `generalSettings.propertyTypes` for formatting decisions.

`src/utils/storage-utils.ts` — Exports the `generalSettings` singleton containing `propertyTypes`, vault settings, and other configuration.

`src/utils/content-extractor.ts` — Uses [[Defuddle]] to extract schema.org data, meta tags, title, author, and main content from pages.

`src/types/types.ts` — TypeScript interfaces: `Template`, `Property`, `PropertyType`, `Settings`.

`src/utils/__mocks__/webextension-polyfill.ts` — Clipper's own mock for browser extension APIs. The test harness reuses this via an alias.

