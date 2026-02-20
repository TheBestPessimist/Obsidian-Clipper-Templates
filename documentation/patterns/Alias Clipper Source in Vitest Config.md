---
created: 2026-02-20
related:
  - "[[patterns]]"
  - "[[Clipper Template Test Harness]]"
  - "[[Vitest]]"
  - "[[gotchas/Clipper Dependencies Must Be in Module Directories]]"
---

The [[Vitest]] config aliases `clipper` to the clipper source directory so imports work cleanly:

```typescript
resolve: {
  alias: {
    'clipper': path.resolve(clipperRoot, 'src'),
    'webextension-polyfill': path.resolve(clipperRoot, 'src/utils/__mocks__/webextension-polyfill.ts'),
  },
},
```

The `webextension-polyfill` alias points to clipper's existing mock so browser extension imports don't fail in Node.js.

The `define` block sets `DEBUG_MODE: false` because clipper code references this global.

The `environment` is `jsdom` for DOM APIs.

