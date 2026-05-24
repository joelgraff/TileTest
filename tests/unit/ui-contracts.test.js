import { describe, expect, it, vi } from 'vitest';

import DialogManager from '../../dialogManager.js';
import GameState from '../../gameState.js';
import QuestManager from '../../questManager.js';
import { bindSceneBooleanFlag } from '../../stateBindings.js';
import UIManager from '../../uiManager.js';

describe('UIManager contracts', () => {
    it('exposes a score increment method for gameplay systems', () => {
        expect(typeof UIManager.prototype.addScore).toBe('function');
        expect(typeof UIManager.prototype.updateScore).toBe('function');
        expect(typeof UIManager.prototype.collectVendorItem).toBe('function');
        expect(typeof UIManager.prototype.handleQuestCompletion).toBe('function');
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

    it('can bind shared dialog and panel visibility state across UI surfaces', () => {
        const state = new GameState();
        const uiContext = {};
        const dialogContext = {
            scene: {}
        };

        UIManager.prototype.setState.call(uiContext, state);
        DialogManager.prototype.setState.call(dialogContext, state);

        uiContext.isInventoryOpen = true;
        uiContext.isQuestsOpen = true;
        uiContext.isHelpOpen = true;
        dialogContext.isDialogOpen = true;

        expect(state.isInventoryOpen).toBe(true);
        expect(state.isQuestsOpen).toBe(true);
        expect(state.isHelpOpen).toBe(true);
        expect(state.isDialogOpen).toBe(true);
        expect(dialogContext.scene.isDialogOpen).toBe(true);

        dialogContext.scene.isDialogOpen = false;

        expect(dialogContext.isDialogOpen).toBe(false);
        expect(state.isDialogOpen).toBe(false);
    });

    it('can bind a scene readiness flag directly to shared gameplay state', () => {
        const state = new GameState();
        const scene = {};

        bindSceneBooleanFlag(scene, state, 'interactionsEnabled');

        expect(scene.interactionsEnabled).toBe(false);

        scene.interactionsEnabled = true;

        expect(state.interactionsEnabled).toBe(true);

        state.interactionsEnabled = false;

        expect(scene.interactionsEnabled).toBe(false);
    });
});