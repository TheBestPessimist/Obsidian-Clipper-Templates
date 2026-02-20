---
created: 2026-02-20
related:
  - "[[Obsidian Clipper]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[decisions/Import Real Clipper Modules Do Not Reimplement]]"
  - "[[patterns/Single Assertion Against Expected File]]"
---

The goal was to make [[Obsidian Clipper]] template development faster. Developing templates manually requires opening a browser, clicking the extension, checking output, and lots of context switching. This is slow and painful.

The solution is a test harness that runs with `npm test`. It reads an HTML fixture, reads a template JSON, calls `evaluateTemplate(html, template)`, and compares the result against an expected markdown file. One assertion, full coverage of frontmatter and content.

```typescript
const html = readFixture('imdb/Andromeda (TV Series 2000–2005) - IMDb.html');
const template = JSON.parse(readFixture('templates/imdb-series-clipper.json'));
const expected = readFixture('Andromeda (2000).md');

const actual = await evaluateTemplate(html, template, {
  url: 'https://www.imdb.com/title/tt0213327/',
  date: new Date('2026-02-20'),
});

expect(actual).toBe(expected);
```

The test harness lives in `test-harness/` and fixtures live in `test resources/`. Run tests with `cd test-harness && npm test`.

The key principle is [[decisions/Import Real Clipper Modules Do Not Reimplement]]. Everything else flows from that.

