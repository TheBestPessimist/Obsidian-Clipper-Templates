---
created: 2026-02-20
related:
  - "[[Obsidian Clipper]]"
  - "[[Clipper Template Test Harness]]"
  - "[[gotchas/Clipper generateFrontmatter Uses generalSettings Not Property Type]]"
  - "[[gotchas/Clipper Active Tab Query Prevents True Parallelism]]"
  - "[[How Clipper Resolves Template Variables]]"
---

`src/utils/renderer.ts` — The `render()` function resolves template variables. The `createSelectorResolver()` function creates a resolver that queries the DOM via browser messaging (or our [[JSDOM]] replacement).

`src/utils/filters.ts` — Filter implementations for `|slice`, `|wikilink`, `|split`, `|join`, and others. The `applyFilters()` function chains them.

`src/utils/obsidian-note-creator.ts` — The `generateFrontmatter()` function produces YAML from properties. Uses `generalSettings.propertyTypes` for formatting decisions.

`src/utils/storage-utils.ts` — Exports the `generalSettings` singleton containing `propertyTypes`, vault settings, and other configuration.

`src/utils/content-extractor.ts` — Uses [[Defuddle]] to extract schema.org data, meta tags, title, author, and main content from pages.

`src/types/types.ts` — TypeScript interfaces: `Template`, `Property`, `PropertyType`, `Settings`.

`src/utils/__mocks__/webextension-polyfill.ts` — Clipper's own mock for browser extension APIs. The test harness reuses this via an alias.

`src/background/background.ts` — Service worker for the extension. Handles tab activation queries via `chrome.tabs.query({active: true, currentWindow: true})`. This is why parallel tests in a single browser can't work without sequential clipping. See [[Clipper Active Tab Query Prevents True Parallelism]].

`src/content.ts` — Content script injected into web pages. Contains `toggleIframe()` which creates the clipper iframe overlay. Responds to `toggle-iframe` messages from the background script.
