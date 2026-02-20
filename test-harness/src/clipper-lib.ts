/**
 * Clipper Library for Testing
 *
 * This module wraps the actual Obsidian Clipper code to enable testing templates
 * against saved HTML fixtures. It uses the real clipper modules - we only mock
 * the browser messaging by providing a JSDOM-based selector resolver.
 */

import { JSDOM } from 'jsdom';
import Defuddle from 'defuddle';
import dayjs from 'dayjs';

// Import actual clipper modules - the real implementation
import { render, createSelectorResolver, RenderContext } from 'clipper/utils/renderer';
import { applyFilterDirect } from 'clipper/utils/filters';
import { generateFrontmatter } from 'clipper/utils/obsidian-note-creator';
import { generalSettings } from 'clipper/utils/storage-utils';
import { Property } from 'clipper/types/types';

// Re-export types for convenience
export { RenderContext } from 'clipper/utils/renderer';

// Types for template structure
export interface TemplateProperty {
  name: string;
  value: string;
  type: string;
}

export interface ClipperTemplate {
  schemaVersion: string;
  name: string;
  behavior: string;
  noteContentFormat: string;
  properties: TemplateProperty[];
  triggers?: string[];
  noteNameFormat: string;
  path: string;
}

export interface ClipperOptions {
  /** Override the current date (for reproducible tests) */
  date?: Date;
  /** The URL the page was loaded from */
  url: string;
}

export interface PageContent {
  title: string;
  author: string;
  description: string;
  content: string;
  image: string;
  favicon: string;
  published: string;
  site: string;
  wordCount: number;
  schemaOrgData: any;
  metaTags: Array<{ name?: string | null; property?: string | null; content: string | null }>;
  dom: JSDOM;
  document: Document;
}

/**
 * Extract page content from HTML using Defuddle (same as the real clipper).
 */
export function extractPageContent(html: string, url: string): PageContent {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Use Defuddle exactly as the real clipper does
  const defuddled = new Defuddle(document, { url }).parse();

  return {
    title: defuddled.title || '',
    author: defuddled.author || '',
    description: defuddled.description || '',
    content: defuddled.content || '',
    image: defuddled.image || '',
    favicon: defuddled.favicon || '',
    published: defuddled.published || '',
    site: defuddled.site || '',
    wordCount: defuddled.wordCount || 0,
    schemaOrgData: defuddled.schemaOrgData || null,
    metaTags: defuddled.metaTags || [],
    dom,
    document,
  };
}

/**
 * Create a JSDOM-based message sender that mimics browser.tabs.sendMessage.
 * This is what we inject into createSelectorResolver instead of real browser messaging.
 */
function createJSDOMMessageSender(document: Document) {
  return async (_tabId: number, message: any): Promise<any> => {
    if (message.action === 'extractContent') {
      const { selector, attribute, extractHtml } = message;
      const content = extractContentBySelector(document, selector, attribute, extractHtml);
      return { content };
    }
    return undefined;
  };
}

/**
 * Extract content by CSS selector from JSDOM document.
 * This mirrors content.ts extractContentBySelector.
 */
function extractContentBySelector(
  document: Document,
  selector: string,
  attribute?: string,
  extractHtml: boolean = false
): string | string[] {
  try {
    const elements = document.querySelectorAll(selector);

    if (elements.length > 1) {
      return Array.from(elements).map((el) => {
        if (attribute) {
          return el.getAttribute(attribute) || '';
        }
        return extractHtml ? el.outerHTML : el.textContent?.trim() || '';
      });
    } else if (elements.length === 1) {
      if (attribute) {
        return elements[0].getAttribute(attribute) || '';
      }
      return extractHtml ? elements[0].outerHTML : elements[0].textContent?.trim() || '';
    } else {
      return '';
    }
  } catch (error) {
    console.error('Error in extractContentBySelector:', error, { selector, attribute, extractHtml });
    return '';
  }
}

/**
 * Get domain from URL (mirrors string-utils.ts getDomain)
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return hostname;
    }
    const hostParts = hostname.split('.');
    if (hostParts.length > 2) {
      const lastTwo = hostParts.slice(-2).join('.');
      if (lastTwo.match(/^(co|com|org|net|edu|gov|mil)\.[a-z]{2}$/)) {
        return hostParts.slice(-3).join('.');
      }
    }
    return hostParts.slice(-2).join('.');
  } catch {
    return '';
  }
}

/**
 * Add schema.org data to variables (mirrors content-extractor.ts addSchemaOrgDataToVariables)
 */
function addSchemaOrgDataToVariables(
  schemaData: any,
  variables: Record<string, string>,
  prefix: string = ''
): void {
  if (Array.isArray(schemaData)) {
    schemaData.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      if (item['@type']) {
        if (Array.isArray(item['@type'])) {
          item['@type'].forEach((type: string) => {
            addSchemaOrgDataToVariables(item, variables, `@${type}:`);
          });
        } else {
          addSchemaOrgDataToVariables(item, variables, `@${item['@type']}:`);
        }
      }
    });
  } else if (typeof schemaData === 'object' && schemaData !== null) {
    // Store the entire object as JSON
    const objectKey = `{{schema:${prefix.replace(/\.$/, '')}}}`;
    variables[objectKey] = JSON.stringify(schemaData);

    // Process individual properties
    Object.entries(schemaData).forEach(([key, value]) => {
      if (key === '@type') return;

      const variableKey = `{{schema:${prefix}${key}}}`;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        variables[variableKey] = String(value);
      } else if (Array.isArray(value)) {
        variables[variableKey] = JSON.stringify(value);
        value.forEach((item, index) => {
          addSchemaOrgDataToVariables(item, variables, `${prefix}${key}[${index}].`);
        });
      } else if (typeof value === 'object' && value !== null) {
        addSchemaOrgDataToVariables(value, variables, `${prefix}${key}.`);
      }
    });
  }
}

/**
 * Build variables from page content (mirrors content-extractor.ts initializePageContent)
 */
export function buildVariables(
  pageContent: PageContent,
  url: string,
  date: Date = new Date()
): Record<string, string> {
  const currentDate = dayjs(date);

  const variables: Record<string, string> = {
    '{{author}}': (pageContent.author || '').trim(),
    '{{content}}': (pageContent.content || '').trim(),
    '{{contentHtml}}': (pageContent.content || '').trim(),
    '{{date}}': currentDate.format('YYYY-MM-DD'),
    '{{time}}': currentDate.format('YYYY-MM-DDTHH:mm:ssZ'),
    '{{description}}': (pageContent.description || '').trim(),
    '{{domain}}': getDomain(url),
    '{{favicon}}': pageContent.favicon || '',
    '{{image}}': pageContent.image || '',
    '{{published}}': (pageContent.published || '').split(',')[0].trim(),
    '{{site}}': (pageContent.site || '').trim(),
    '{{title}}': (pageContent.title || '').trim(),
    '{{url}}': url.trim(),
    '{{words}}': (pageContent.wordCount || 0).toString(),
    '{{selection}}': '',
    '{{selectionHtml}}': '',
    '{{highlights}}': '',
    '{{fullHtml}}': '',
    '{{noteName}}': (pageContent.title || '').trim(),
  };

  // Add meta tags
  if (pageContent.metaTags) {
    pageContent.metaTags.forEach((meta) => {
      if (meta.name && meta.content) {
        variables[`{{meta:name:${meta.name}}}`] = meta.content;
      }
      if (meta.property && meta.content) {
        variables[`{{meta:property:${meta.property}}}`] = meta.content;
      }
    });
  }

  // Add schema.org data
  if (pageContent.schemaOrgData) {
    addSchemaOrgDataToVariables(pageContent.schemaOrgData, variables);
  }

  return variables;
}

/**
 * Render a template string using the actual clipper renderer.
 * This is the main function for testing templates.
 */
export async function renderTemplate(
  template: string,
  pageContent: PageContent,
  url: string,
  options: { date?: Date } = {}
): Promise<string> {
  const variables = buildVariables(pageContent, url, options.date);

  // Create the JSDOM-based message sender
  const sendMessage = createJSDOMMessageSender(pageContent.document);

  // Create the async resolver using the real clipper function, but with our JSDOM sender
  const asyncResolver = createSelectorResolver(0, sendMessage);

  // Build the render context (same structure as real clipper)
  const context: RenderContext = {
    variables,
    currentUrl: url,
    tabId: 0,
    asyncResolver,
    applyFilterDirect,
  };

  // Use the actual clipper renderer
  const result = await render(template, context);

  if (result.errors.length > 0) {
    console.error('Template render errors:', result.errors);
  }

  return result.output;
}

/**
 * Render a complete template (from JSON file) against page content.
 */
export async function renderClipperTemplate(
  template: ClipperTemplate,
  pageContent: PageContent,
  url: string,
  options: { date?: Date } = {}
): Promise<{ noteName: string; properties: Array<{ name: string; value: string; type: string }>; content: string }> {
  const renderOpts = { date: options.date };

  // Render note name
  const noteName = await renderTemplate(template.noteNameFormat, pageContent, url, renderOpts);

  // Render properties
  const renderedProperties = await Promise.all(
    template.properties.map(async (prop) => ({
      name: prop.name,
      value: await renderTemplate(prop.value, pageContent, url, renderOpts),
      type: prop.type,
    }))
  );

  // Render content
  const content = await renderTemplate(template.noteContentFormat, pageContent, url, renderOpts);

  return { noteName, properties: renderedProperties, content };
}

/**
 * The main function for testing - evaluates a template against HTML and returns full markdown.
 *
 * Usage:
 *   const html = readFileSync('fixture.html', 'utf-8');
 *   const template = JSON.parse(readFileSync('template.json', 'utf-8'));
 *   const expected = readFileSync('expected.md', 'utf-8');
 *   const actual = await evaluateTemplate(html, template, { url: 'https://example.com' });
 *   expect(actual).toBe(expected);
 */
export async function evaluateTemplate(
  html: string,
  template: ClipperTemplate,
  options: { url: string; date?: Date } = { url: 'https://example.com' }
): Promise<string> {
  const pageContent = extractPageContent(html, options.url);
  const result = await renderClipperTemplate(template, pageContent, options.url, { date: options.date });

  // Set up generalSettings.propertyTypes from the template's property types
  // This is what the real clipper uses to determine how to format each property
  generalSettings.propertyTypes = template.properties.map(p => ({
    name: p.name,
    type: p.type || 'text',
  }));

  // Convert to Property[] format expected by generateFrontmatter
  const properties: Property[] = result.properties.map(p => ({
    name: p.name,
    value: p.value,
  }));

  // Use the real clipper's generateFrontmatter
  const frontmatter = await generateFrontmatter(properties);

  // Join frontmatter and content
  // Content may start with \n (from template), so just add one \n after ---
  const content = result.content.startsWith('\n')
    ? result.content.slice(1)  // Remove leading newline if present
    : result.content;

  const markdown = frontmatter + '\n' + content + '\n';

  return markdown;
}
