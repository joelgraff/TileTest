import { describe, expect, it } from 'vitest';

import UIManager from '../../uiManager.js';

describe('UIManager contracts', () => {
    it('exposes a score increment method for gameplay systems', () => {
        expect(typeof UIManager.prototype.addScore).toBe('function');
        expect(typeof UIManager.prototype.updateScore).toBe('function');
    });

    it('exposes dialog state through a UIManager accessor', () => {
        const descriptor = Object.getOwnPropertyDescriptor(UIManager.prototype, 'isDialogOpen');

        expect(descriptor).toBeTruthy();
        expect(typeof descriptor.get).toBe('function');
    });
});