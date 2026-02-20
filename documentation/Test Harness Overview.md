---
created: 2026-02-20
tags:
  - test-harness
  - obsidian-clipper
  - documentation
related:
  - "[[Architecture]]"
  - "[[What Worked]]"
  - "[[What Did Not Work]]"
  - "[[Gotchas]]"
  - "[[How to Add Tests]]"
---

# Test Harness Overview

## The Problem

Developing [[Obsidian Clipper]] templates is slow and painful:
- Requires manually opening a browser
- Clicking the extension
- Checking output
- Lots of context switching

## The Solution

A test harness that:
1. Reads an HTML fixture file
2. Reads a template JSON file  
3. Reads an expected markdown file
4. Calls `evaluateTemplate(html, template)` 
5. Compares actual vs expected with a single assertion

## The Simple API

```typescript
const html = readFixture('imdb/page.html');
const template = JSON.parse(readFixture('templates/imdb-series-clipper.json'));
const expected = readFixture('Andromeda (2000).md');

const actual = await evaluateTemplate(html, template, {
  url: 'https://www.imdb.com/title/tt0213327/',
  date: new Date('2026-02-20'),
});

expect(actual).toBe(expected);
```

## Key Principles

1. **DO NOT reimplement clipper code** - import and use the real functions
2. **Treat clipper as a black box** - only mock what's absolutely necessary (browser messaging)
3. **Tests should be stable** - following real clipper behavior means fewer test changes

## Running Tests

```bash
cd test-harness
npm test
```

## File Structure

```
test-harness/
├── docs/                  # This documentation
├── src/
│   ├── clipper-lib.ts     # Main library wrapping clipper
│   └── imdb.test.ts       # Test file
├── package.json
├── tsconfig.json
└── vitest.config.ts

test resources/
├── templates/             # Template JSON files
├── imdb/                  # HTML fixtures
└── *.md                   # Expected output files
```

## See Also

- [[Architecture]] - How the harness works internally
- [[What Worked]] - Approaches that succeeded
- [[What Did Not Work]] - Failed approaches and why
- [[Gotchas]] - Things to watch out for
- [[How to Add Tests]] - Guide for adding new test cases
- [[Clipper Internals]] - Knowledge about clipper's codebase

