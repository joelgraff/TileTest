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
});