import { test, expect, runHarClip, readExpected, expectEqualsIgnoringNewlines } from '../fixtures';

test.describe('Google Maps Templates', () => {
    test('Waterfall Of The Good Travel Mountains', async ({ extensionContext, extensionId }) => {
        const { content, noteName } = await runHarClip(extensionContext, extensionId, {
            harPath: 'googlemaps/google maps - waterfall of the good travel mountains - portugal.har',
            templatePath: 'google-maps-clipper.json',
        });
        const expected = readExpected('googlemaps/Waterfall Of The Good Travel Mountains - Cascata de Quiaios.md');
        expectEqualsIgnoringNewlines(content, expected);
        expect(noteName).toBe('Waterfall Of The Good Travel Mountains - Cascata de Quiaios — Quiaios');
    });
});
