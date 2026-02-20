---
created: 2026-02-20
topics:
  - "[[Test Harness]]"
  - "[[How-To]]"
related:
  - "[[Test Harness Overview]]"
  - "[[Gotchas]]"
---

# How to Add Tests

## Step 1: Save the HTML Fixture

1. Open the page in your browser
2. Save as "Web Page, Complete" or use browser DevTools to copy HTML
3. Save to `test resources/<category>/<page-name>.html`

Example: `test resources/imdb/Andromeda (TV Series 2000–2005) - IMDb.html`

## Step 2: Export Your Template

1. In Obsidian Clipper settings, export your template
2. Save to `test resources/templates/<template-name>-clipper.json`

Example: `test resources/templates/imdb-series-clipper.json`

## Step 3: Create Expected Output

1. Clip the page with your template normally
2. Copy the output from Obsidian Clipper's preview
3. Save as `test resources/<expected-name>.md`

Example: `test resources/Andromeda (2000).md`

**Important**: Make sure the file ends with exactly one newline.

## Step 4: Write the Test

Create or add to a test file in `test-harness/src/`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluateTemplate, ClipperTemplate } from './clipper-lib';

const fixtureRoot = resolve(__dirname, '../../test resources');

function readFixture(relativePath: string): string {
  return readFileSync(resolve(fixtureRoot, relativePath), 'utf-8');
}

describe('Your Template Name', () => {
  it('should render page correctly', async () => {
    const html = readFixture('category/page.html');
    const template: ClipperTemplate = JSON.parse(
      readFixture('templates/your-template-clipper.json')
    );
    const expected = readFixture('Expected Output.md');

    const actual = await evaluateTemplate(html, template, {
      url: 'https://original-page-url.com/path',
      date: new Date('2026-02-20'),  // Fixed date for reproducibility
    });

    expect(actual).toBe(expected);
  });
});
```

## Step 5: Run the Test

```bash
cd test-harness
npm test
```

## Tips

### Use Fixed Dates
If your template uses `{{date}}`, always pass a fixed date for reproducible tests.

### Match the Original URL
The URL affects `{{domain}}`, `{{url}}`, and relative link resolution.

### Organize by Category
Group related fixtures:
```
test resources/
├── imdb/          # IMDB pages
├── wikipedia/     # Wikipedia pages  
├── youtube/       # YouTube pages
└── templates/     # All template JSONs
```

### Multiple Test Cases per Template
Test the same template against different pages:

```typescript
describe('IMDB Series Template', () => {
  it('should render Andromeda correctly', async () => { ... });
  it('should render Star Trek correctly', async () => { ... });
  it('should render Doctor Who correctly', async () => { ... });
});
```

## See Also

- [[Gotchas]] - Common pitfalls
- [[Test Harness Overview]] - Architecture overview
