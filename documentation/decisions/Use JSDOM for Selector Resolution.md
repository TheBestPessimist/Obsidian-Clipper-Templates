---
created: 2026-02-20
related:
  - "[[decisions]]"
  - "[[Clipper Template Test Harness]]"
  - "[[JSDOM]]"
  - "[[gotchas/JSDOM Version Must Be 24 Not 26]]"
---

In the browser, clipper resolves `{{selector:CSS_SELECTOR}}` variables by sending messages to a content script that queries the DOM. This uses `browser.tabs.sendMessage`.

In tests, there's no browser. The clipper's `createSelectorResolver()` function accepts a `sendMessage` parameter, which we replace with a function that queries [[JSDOM]] directly:

```typescript
const selectorResolver = createSelectorResolver((message) => {
  const element = document.querySelector(message.selector);
  return element?.textContent || '';
});
```

This is the only place where browser messaging is mocked. Everything else—rendering, filtering, frontmatter generation—uses real clipper code unchanged.

