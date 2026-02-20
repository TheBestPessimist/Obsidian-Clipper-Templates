import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluateTemplate, ClipperTemplate } from './clipper-lib';

// Helper to read test fixtures
function readFixture(relativePath: string): string {
  const fullPath = resolve(__dirname, '../../test resources', relativePath);
  return readFileSync(fullPath, 'utf-8');
}

describe('IMDB Series Template', () => {
  it('should render Andromeda correctly', async () => {
    const html = readFixture('imdb/Andromeda (TV Series 2000–2005) - IMDb.html');
    const template: ClipperTemplate = JSON.parse(readFixture('templates/imdb-series-clipper.json'));
    const expected = readFixture('Andromeda (2000).md');

    const actual = await evaluateTemplate(html, template, {
      url: 'https://www.imdb.com/title/tt0213327/',
      date: new Date('2026-02-20'),
    });

    expect(actual).toBe(expected);
  });
});
