import { describe, expect, it, vi } from 'vitest';

import GameState from '../../gameState.js';
import QuestManager from '../../questManager.js';
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

    it('can bind shared gameplay state without changing the public manager API', () => {
        const state = new GameState();
        const uiContext = {};
        const questContext = {};

        UIManager.prototype.setState.call(uiContext, state);
        QuestManager.prototype.setState.call(questContext, state);

        uiContext.inventory = [{ id: 'item-1', name: 'Shared Item' }];
        uiContext.score = 12;
        questContext.activeQuests = [{ id: 'quest-1', title: 'Shared Quest' }];
        questContext.completedQuests = [{ id: 'quest-2', title: 'Done Quest' }];

        expect(state.inventory).toEqual([{ id: 'item-1', name: 'Shared Item' }]);
        expect(state.score).toBe(12);
        expect(state.activeQuests).toEqual([{ id: 'quest-1', title: 'Shared Quest' }]);
        expect(state.completedQuests).toEqual([{ id: 'quest-2', title: 'Done Quest' }]);
        expect(uiContext.inventory).toBe(state.inventory);
        expect(questContext.activeQuests).toBe(state.activeQuests);
    });
});