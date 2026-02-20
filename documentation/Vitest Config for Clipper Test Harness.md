---
created: 2026-02-20
topics:
  - "[[Vitest]]"
  - "[[Testing]]"
related:
  - "[[Clipper Template Test Harness]]"
  - "[[JSDOM Version Must Be 24 Not 26]]"
  - "[[Clipper Dependencies Must Be in Module Directories]]"
---

The [[Vitest]] configuration in `test-harness/vitest.config.ts` has several important settings.

The `clipper` alias points to the clipper source so imports like `import { render } from 'clipper/utils/renderer'` work:

```typescript
resolve: {
  alias: {
    'clipper': path.resolve(clipperRoot, 'src'),
    'webextension-polyfill': path.resolve(clipperRoot, 'src/utils/__mocks__/webextension-polyfill.ts'),
  },
},
```

The `webextension-polyfill` alias points to clipper's existing mock so browser extension imports don't fail in Node.js.

The `moduleDirectories` setting includes clipper's `node_modules` so shared dependencies like `dayjs` resolve correctly. See [[Clipper Dependencies Must Be in Module Directories]].

The `define` block sets `DEBUG_MODE: false` because clipper code references this global.

The `environment` is `jsdom` for DOM APIs.

