import { describe, expect, it, vi } from 'vitest';

import {
    createHelpDialogData,
    createInventoryDialogData,
    createQuestCompletionDialogData,
    createQuestDialogData,
    createQuestUnavailableDialogData
} from '../../uiDialogModels.js';

describe('ui dialog models', () => {
    it('builds inventory dialog content without UI rendering state', () => {
        const onClose = vi.fn();
        const dialog = createInventoryDialogData({
            inventory: [{
                name: 'Test Item',
                description: 'A fixture item',
                value: 5
            }],
            onClose
        });

        expect(dialog).toEqual({
            renderMode: 'dom',
            title: 'Inventory',
            text: 'INVENTORY\n\n1. Test Item\n   A fixture item\n   Value: 5 points\n\n',
            buttons: [],
            exitButton: {
                label: 'Close',
                onClick: onClose
            }
        });
    });

    it('builds paginated quest dialog content from quest data alone', () => {
        const onClose = vi.fn();
        const dialog = createQuestDialogData({
            activeQuests: [{
                title: 'Injected Quest',
                description: 'Quest data should not require scene lookup',
                objectives: [{ collected: false }, { collected: true }]
            }],
            completedQuests: [{
                title: 'Done Quest',
                reward: { points: 25 }
            }],
            page: 2,
            onClose
        });

        expect(dialog.title).toBe('Quests');
        expect(dialog.renderMode).toBe('dom');
        expect(dialog.text).toContain('=== ACTIVE QUESTS ===');
        expect(dialog.text).toContain('1. Injected Quest');
        expect(dialog.text).toContain('   Progress: 1/2 items collected');
        expect(dialog.text).toContain('=== COMPLETED QUESTS ===');
        expect(dialog.text).toContain('1. Done Quest ✓');
        expect(dialog.textPagination).toEqual({
            currentPage: 2,
            text: dialog.text
        });
        expect(dialog.exitButton).toEqual({
            label: 'Close',
            onClick: onClose
        });
    });

    it('distinguishes discovery passport progress from item collection progress', () => {
        const dialog = createQuestDialogData({
            activeQuests: [{
                type: 'discovery',
                title: 'Discovery Passport',
                description: 'Visit fixture vendors.',
                objectives: [
                    {
                        vendorName: 'Vendor One',
                        booth: 'A1',
                        clue: 'Find the repair bench.',
                        goal: 'Ask what needs fixing.',
                        visited: true
                    },
                    {
                        vendorName: 'Vendor Two',
                        booth: 'B2',
                        clue: 'Ask about the portable demo.',
                        visited: false
                    }
                ]
            }],
            completedQuests: [],
            onClose: vi.fn()
        });

        expect(dialog.text).toContain('   Progress: 1/2 vendors visited');
        expect(dialog.text).toContain('   ✓ Vendor One (A1): Find the repair bench. Goal: Ask what needs fixing.');
        expect(dialog.text).toContain('   - Vendor Two (B2): Ask about the portable demo.');
        expect(dialog.text).toContain('=== FESTIVAL LOG ===');
        expect(dialog.text).toContain('Stamps in progress:');
        expect(dialog.text).toContain('- Discovery Passport');
        expect(dialog.text).not.toContain('   Progress: 1/2 items collected');
    });

    it('renders festival log payoff for completed discovery trails', () => {
        const dialog = createQuestDialogData({
            activeQuests: [],
            completedQuests: [{
                id: 'quest-1',
                type: 'discovery',
                title: 'Starter Trail',
                completionText: 'Starter trail complete.',
                completed: true,
                objectives: [
                    {
                        vendorName: 'Vendor One',
                        booth: 'A1',
                        clue: 'Find the repair bench.',
                        goal: 'Ask what needs fixing.',
                        visited: true
                    }
                ],
                reward: {
                    points: 30,
                    description: '30 points'
                }
            }],
            inventory: [{ name: 'Fixture Item', value: 5 }],
            score: 35,
            onClose: vi.fn()
        });

        expect(dialog.text).toContain('=== FESTIVAL LOG ===');
        expect(dialog.text).toContain('Score: 35 points');
        expect(dialog.text).toContain('Passport stamps: 1');
        expect(dialog.text).toContain('Quest rewards earned: 30 points');
        expect(dialog.text).toContain('Items collected: 1');
        expect(dialog.text).toContain('Completed trails:');
        expect(dialog.text).toContain('1. Starter Trail ✓');
        expect(dialog.text).toContain('   Starter trail complete.');
        expect(dialog.text).toContain('   ✓ Vendor One (A1): Find the repair bench. Goal: Ask what needs fixing.');
    });

    it('builds help and quest fallback dialogs from pure content helpers', () => {
        const onClose = vi.fn();
        const helpDialog = createHelpDialogData({ onClose });
        const unavailableDialog = createQuestUnavailableDialogData({ onClose });
        const completionDialog = createQuestCompletionDialogData({
            quest: {
                title: 'Quest Completed',
                reward: {
                    points: 50,
                    description: 'Reward text'
                }
            },
            onClose
        });

        expect(helpDialog.title).toBe('Help');
        expect(helpDialog.renderMode).toBe('dom');
        expect(helpDialog.text).toContain('Spacebar: Interact with nearby vendor');
        expect(unavailableDialog).toEqual({
            renderMode: 'dom',
            title: 'Quests',
            text: 'Quest system not available',
            exitButton: {
                label: 'Close',
                onClick: onClose
            }
        });
        expect(completionDialog).toEqual({
            renderMode: 'dom',
            title: 'Quest Completed!',
            text: 'Quest Completed\n\nReward: 50 points\n\nReward text',
            buttons: [{
                label: 'Great!',
                onClick: onClose
            }]
        });
    });
});