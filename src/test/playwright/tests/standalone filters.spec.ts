/**
 * Filter tests for quick iteration on Clipper filter expressions.
 * Uses runFilterTestsAndAssert to test multiple filters against a single HAR file.
 */

import {test, runFilterTestsAndAssert, runFilterTests} from '../fixtures';

test.describe('Standalone Filter Tests', () => {
//     test('Shogun selectors', async ({extensionContext, extensionId}) => {
//         await runFilterTestsAndAssert(extensionContext, extensionId, {
//             harPath: 'imdb/Shogun 1980.har',
//             filters: [
//                 {
//                     filter: `{% for i in selector:span.ipc-chip__text %}{% if i != "Back to top" %}[[{{i}}]], {% endif %}{% endfor %}`,
//                     expected: `[[Period Drama]],
// [[War Epic]],
// [[Adventure]],
// [[Drama]],
// [[History]],
// [[War]],`,
//                 },
//                 {
//                     filter: `{{schema:@TVSeries:name}}`,
//                     expected: `Shogun`,
//                 },
//                 {
//                     filter: `{{schema:actor[*].name|slice:0,3|join:", "}}`,
//                     expected: `Richard Chamberlain, Toshirô Mifune, Yôko Shimada`,
//                 },
//             ],
//         });
//     });
//
//     test('Brooklyn Nine-Nine genre extraction', async ({extensionContext, extensionId}) => {
//         await runFilterTestsAndAssert(extensionContext, extensionId, {
//             harPath: 'imdb/Brooklyn Nine-Nine.har',
//             filters: [
//                 {
//                     filter: `{{schema:@TVSeries:genre|merge:selector:a[href*="/interest/"] span.ipc-chip__text|unique|sort|wikilink|join}}`,
//                     expected: `[[Comedy]],[[Crime]],[[Police Procedural]],[[Sitcom]]`,
//                 },
//             ],
//         });
//     });
//
//     test('Conditional related links via split + wikilink + join', async ({extensionContext, extensionId}) => {
//         await runFilterTestsAndAssert(extensionContext, extensionId, {
//             harPath: 'imdb/Another Earth.har',
//             filters: [
//                 {
//                     filter: `{% if schema:@TVSeries:name %}
// {% set related = "Film,Series,imdb,Clippings"|split:","|wikilink|join %}
// {% else %}
// {% set related = "Film,imdb,Clippings"|split:","|wikilink|join %}
// {% endif %}
// {{related}}`,
//                     expected: `[[Film]],[[imdb]],[[Clippings]]`,
//                 },
//             ],
//         });
//     });
//
//     test('Ponyo producers - testing various approaches', async ({extensionContext, extensionId}) => {
//         await runFilterTestsAndAssert(extensionContext, extensionId, {
//             harPath: 'imdb/Ponyo.har',
//             filters: [
//                 {
//                     filter: `{{selector:[data-testid="title-details-companies"] a[href*="/company/"]|wikilink|join}}`,
//                     expected: `[[Studio Ghibli]],[[Nippon Television Network (NTV)]],[[Dentsu]]`,
//                 },
//             ],
//         });
//     });
//
//     test('Shangri-La producers filter debug', async ({extensionContext, extensionId}) => {
//         const results = await runFilterTests(extensionContext, extensionId, {
//             harPath: 'mal/Shangri-la.har',
//             filters: [
//                 {
//                     filter: `{{selectorHtml:.leftside|split:"Producers:"|last|split:"Licensors:"|first|split:"Studios:"|first|strip_tags}}`,
//                     expected: 'stage1',
//                 },
//                 {
//                     filter: `{{selectorHtml:.leftside|split:"Producers:"|last|split:"Licensors:"|first|split:"Studios:"|first|strip_tags|replace:"/  +/g":" "|trim}}`,
//                     expected: 'stage2',
//                 },
//                 {
//                     filter: `{{selectorHtml:.leftside|split:"Producers:"|last|split:"Licensors:"|first|split:"Studios:"|first|strip_tags|replace:"/  +/g":" "|trim|split:", "}}`,
//                     expected: 'stage3',
//                 },
//                 {
//                     filter: `{{selectorHtml:.leftside|split:"Producers:"|last|split:"Licensors:"|first|split:"Studios:"|first|strip_tags|replace:"/  +/g":" "|trim|split:", "|wikilink}}`,
//                     expected: 'stage4',
//                 },
//             ],
//         });
//         console.log('MAL producers filter debug results:', JSON.stringify(results, null, 2));
//     });
});
