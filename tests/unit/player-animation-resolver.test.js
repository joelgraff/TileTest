import { describe, expect, it } from 'vitest';

import { resolvePlayerAnimationKey } from '../../playerAnimationResolver.js';

describe('player animation resolver', () => {
    it('returns no animation for idle input', () => {
        expect(resolvePlayerAnimationKey({ x: 0, y: 0 })).toBe(null);
    });

    it('prefers horizontal movement when it dominates the vector', () => {
        expect(resolvePlayerAnimationKey({ x: 1, y: 0.25 })).toBe('right');
        expect(resolvePlayerAnimationKey({ x: -1, y: 0.25 })).toBe('left');
    });

    it('falls back to vertical movement when horizontal is not dominant', () => {
        expect(resolvePlayerAnimationKey({ x: 0.25, y: 1 })).toBe('down');
        expect(resolvePlayerAnimationKey({ x: 0.25, y: -1 })).toBe('up');
    });
});