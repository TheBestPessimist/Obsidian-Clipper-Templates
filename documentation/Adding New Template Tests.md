---
created: 2026-02-20
topics:
  - "[[Obsidian Clipper]]"
  - "[[Testing]]"
  - "[[How-To]]"
related:
  - "[[Clipper Template Test Harness]]"
  - "[[Test Fixture Requirements]]"
---

To add a new test case:

**Save the HTML fixture** — Open the page in your browser and save the complete HTML to `test resources/<category>/<page-name>.html`. For example: `test resources/imdb/Andromeda (TV Series 2000–2005) - IMDb.html`.

**Export your template** — In [[Obsidian Clipper]] settings, export the template to `test resources/templates/<name>-clipper.json`.

**Create the expected output** — Clip the page with your template normally, copy the output from the clipper preview, and save it to `test resources/<expected-name>.md`.

**Write the test** — Add to an existing test file or create a new one in `test-harness/src/`:

```typescript
it('should render My Page correctly', async () => {
  const html = readFixture('category/page.html');
  const template: ClipperTemplate = JSON.parse(readFixture('templates/my-template-clipper.json'));
  const expected = readFixture('Expected Output.md');

  const actual = await evaluateTemplate(html, template, {
    url: 'https://original-page-url.com/path',
    date: new Date('2026-02-20'),
  });

  expect(actual).toBe(expected);
});
```

**Run** — `cd test-harness && npm test`

Always use a fixed date if your template uses `{{date}}`. Always use the real URL that matches how the page was originally clipped.

