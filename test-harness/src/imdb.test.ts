import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  extractPageContent,
  renderClipperTemplate,
  ClipperTemplate,
} from './clipper-lib';

// Helper to read test fixtures
function readFixture(relativePath: string): string {
  const fullPath = resolve(__dirname, '../../test resources', relativePath);
  return readFileSync(fullPath, 'utf-8');
}

// Helper to parse expected markdown frontmatter
function parseFrontmatter(markdown: string): { frontmatter: Record<string, any>; content: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const frontmatterLines = match[1].split('\n');
  const frontmatter: Record<string, any> = {};
  let currentKey = '';
  let currentValue: string[] = [];

  for (const line of frontmatterLines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2] ? [keyMatch[2].replace(/^"(.*)"$/, '$1')] : [];
    } else if (line.startsWith('  - ')) {
      currentValue.push(line.slice(4).replace(/^"(.*)"$/, '$1'));
    }
  }
  if (currentKey) {
    frontmatter[currentKey] = currentValue.length === 1 ? currentValue[0] : currentValue;
  }

  return { frontmatter, content: match[2].trim() };
}

describe('IMDB Series Template', () => {
  // Load fixtures once
  const html = readFixture('imdb/Andromeda (TV Series 2000–2005) - IMDb.html');
  const template: ClipperTemplate = JSON.parse(readFixture('templates/imdb-series-clipper.json'));
  const expectedMarkdown = readFixture('Andromeda (2000).md');
  const expected = parseFrontmatter(expectedMarkdown);

  const url = 'https://www.imdb.com/title/tt0213327/';
  // Fix the date to match expected output
  const testDate = new Date('2026-02-20');

  it('should extract page content with Defuddle', async () => {
    const pageContent = extractPageContent(html, url);

    expect(pageContent.title).toBeTruthy();
    expect(pageContent.schemaOrgData).toBeTruthy();
  });

  it('should render note name correctly', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    expect(result.noteName).toBe('Andromeda (2000)');
  });

  it('should render title property', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    const titleProp = result.properties.find(p => p.name === 'title');
    expect(titleProp?.value).toBe(expected.frontmatter.title);
  });

  it('should render year property', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    const yearProp = result.properties.find(p => p.name === 'year');
    expect(yearProp?.value).toBe(expected.frontmatter.year.toString());
  });

  it('should render actors property with wikilinks', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    const actorsProp = result.properties.find(p => p.name === 'actors');
    // Expected: [[Kevin Sorbo]], [[Lisa Ryder]], [[Gordon Michael Woolvett]]
    expect(actorsProp?.value).toContain('[[Kevin Sorbo]]');
    expect(actorsProp?.value).toContain('[[Lisa Ryder]]');
  });

  it('should render genre property with wikilinks', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    const genreProp = result.properties.find(p => p.name === 'genre');
    expect(genreProp?.value).toContain('[[Action]]');
    expect(genreProp?.value).toContain('[[Adventure]]');
    expect(genreProp?.value).toContain('[[Drama]]');
  });

  it('should render date property', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    const dateProp = result.properties.find(p => p.name === 'created');
    expect(dateProp?.value).toBe('2026-02-20');
  });

  it('should render content with synopsis', async () => {
    const pageContent = extractPageContent(html, url);
    const result = await renderClipperTemplate(template, pageContent, url, { date: testDate });

    expect(result.content).toContain('> [!NOTE] synopsis');
    expect(result.content).toContain('Andromeda');
    expect(result.content).toContain('## Thoughts');
    expect(result.content).toContain('REVIEW HERE');
  });
});

