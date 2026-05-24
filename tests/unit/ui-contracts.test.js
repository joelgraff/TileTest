import { describe, expect, it, vi } from 'vitest';

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

    it('allows quest data to be injected as an explicit collaborator', () => {
        const questManager = {
            getActiveQuests: () => [{
                title: 'Injected Quest',
                description: 'Quest data should not require scene lookup',
                objectives: [{ collected: false }, { collected: true }]
            }],
            getCompletedQuests: () => []
        };
        const showDialog = vi.fn();
        const context = {
            questManager,
            showDialog,
            closeDialog: vi.fn(),
            isQuestsOpen: true
        };

        UIManager.prototype.showQuestDialog.call(context);

        const dialog = showDialog.mock.calls[0][0];

        expect(dialog.title).toBe('Quests');
        expect(dialog.textPagination.text.some(item => item.includes('Injected Quest'))).toBe(true);
        expect(dialog.textPagination.text).toContain('   Progress: 1/2 items collected');
    });
});