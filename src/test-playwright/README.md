# Playwright E2E Tests for Obsidian Clipper

These tests run the actual Obsidian Clipper extension in a real browser, clip HTML fixtures, and compare the clipboard output against expected markdown files.

## Prerequisites

1. **Build the extension** (must be done before running tests):
   ```bash
   cd "Other Sources/obsidian-clipper"
   npm install
   npm run build:chrome
   ```
   This creates the `dist/` folder with the built extension.

2. **Install Playwright dependencies**:
   ```bash
   cd src/test-playwright
   npm install
   npx playwright install chromium
   ```

## Running Tests

```bash
cd src/test-playwright
npm test
```

For headed mode (see the browser):
```bash
npm run test:headed
```

For debug mode (step through):
```bash
npm run test:debug
```

## How It Works

1. **Extension Loading**: Playwright launches Chromium with the extension loaded via `--load-extension` flag
2. **Fixture Serving**: A local HTTP server serves HTML fixtures from `test resources/`
3. **Clipping**: The test navigates to the fixture, opens the popup, clicks "Copy to clipboard"
4. **Comparison**: Clipboard content is compared against expected `.md` files (newline-insensitive)

## Gotchas

### Extension must be built first
The tests load from `Other Sources/obsidian-clipper/dist/`. If this folder doesn't exist or is stale, tests will fail.

### Headless mode limitations
Extensions work best in headed mode. The tests use `headless: false` by default. This means a browser window will briefly appear during test runs.

### Active tab detection
The clipper determines which page to clip based on the "active tab". The test must ensure the fixture page is active before the popup opens. If the popup page becomes active instead, the clipper may not find valid content.

### Template selection
By default, the clipper uses its default template. To test specific templates, you may need to:
- Pre-configure extension storage with the desired template
- Or select the template from the dropdown in the popup

### Clipboard permissions
The tests use `--unsafely-allow-clipboard-read-write` to enable clipboard access without user gestures.

## Adding New Tests

1. Add HTML fixture to `test resources/<category>/`
2. Add expected output to `test resources/<expected-file>.md`
3. Add template JSON to `test resources/templates/` (if using custom template)
4. Create test in `tests/<category>.spec.ts`

See `tests/imdb.spec.ts` for example.

