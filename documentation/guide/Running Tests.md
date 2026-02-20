---
created: 2026-02-20
related:
  - "[[guide]]"
  - "[[Clipper Template Test Harness]]"
  - "[[Playwright]]"
---

From the project root:
```bash
npm test
```

Or from the test directory:
```bash
cd src/test-playwright
npm test
```

Other useful commands:
- `npm run test:headed` — run tests with browser visible
- `npm run test:debug` — run tests in debug mode
- `npm run test:ui` — open [[Playwright]] UI

Tests use [[Playwright]] to run the actual [[Obsidian Clipper]] extension in a Chromium browser. The output shows passed/failed tests with timing information.

The clipper source at `Other Sources/obsidian-clipper` must be built first:
```bash
cd "Other Sources/obsidian-clipper"
npm install
npm run build:chrome
```
