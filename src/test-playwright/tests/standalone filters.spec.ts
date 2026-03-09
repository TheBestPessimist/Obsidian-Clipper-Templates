/**
 * Filter tests for quick iteration on Clipper filter expressions.
 * Uses runFilterTestsAndAssert to test multiple filters against a single HAR file.
 */

import { test, runFilterTestsAndAssert } from '../fixtures';

test.describe('IMDB Filter Tests', () => {
  test('Shogun selectors', async ({ extensionContext, extensionId }) => {
    await runFilterTestsAndAssert(extensionContext, extensionId, {
      harPath: 'imdb/Shogun 1980.har',
      filters: [
        {
          filter: `{% for i in selector:span.ipc-chip__text %}{% if i != "Back to top" %}[[{{i}}]], {% endif %}{% endfor %}`,
          expected: `[[Period Drama]],
[[War Epic]],
[[Adventure]],
[[Drama]],
[[History]],
[[War]],`,
        },
        {
          filter: `{{schema:@TVSeries:name}}`,
          expected: `Shogun`,
        },
        {
          filter: `{{schema:actor[*].name|slice:0,3|join:", "}}`,
          expected: `Richard Chamberlain, Toshirô Mifune, Yôko Shimada`,
        },
      ],
    });
  });

  test('Brooklyn Nine-Nine genre extraction', async ({ extensionContext, extensionId }) => {
    await runFilterTestsAndAssert(extensionContext, extensionId, {
      harPath: 'imdb/Brooklyn Nine-Nine.har',
      filters: [
        {
          filter: `{{schema:@TVSeries:genre|merge:selector:a[href*="/interest/"] span.ipc-chip__text|unique|sort|wikilink|join}}`,
          expected: `[[Comedy]],[[Crime]],[[Police Procedural]],[[Sitcom]]`,
        },
      ],
    });
  });
});
