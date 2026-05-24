import { describe, expect, it } from 'vitest';

import DialogManager from '../../dialogManager.js';

describe('DialogManager text pagination', () => {
    it('splits long text arrays into multiple stable pages', () => {
        const items = Array.from({ length: 12 }, (_, index) => `Fact number ${index + 1} with enough text to consume page space.`);

        const pages = DialogManager.prototype.calculateTextPages.call({}, items);

        expect(pages.length).toBeGreaterThan(1);
        expect(pages.flat()).toEqual(items);
        expect(pages.every(page => page.length > 0)).toBe(true);
    });

    it('resolves the requested text page through the public pagination API', () => {
        const items = [
            'First fact with enough text to stay on the first page.',
            'Second fact with enough text to stay on the first page.',
            'Third fact with enough text to stay on the first page.',
            'Fourth fact with enough text to stay on the first page.',
            'Fifth fact with enough text to stay on the first page.',
            'Sixth fact with enough text to stay on the first page.',
            'Seventh fact with enough text to stay on the first page.',
            'Eighth fact with enough text to stay on the first page.',
            'Ninth fact that should spill onto the next page.'
        ];
        const context = {
            calculateTextPages: DialogManager.prototype.calculateTextPages
        };

        const displayText = DialogManager.prototype.handleTextPagination.call(context, items, { currentPage: 1 });

        expect(displayText).toContain('Ninth fact that should spill onto the next page.');
        expect(displayText).not.toContain('First fact with enough text to stay on the first page.');
    });
});