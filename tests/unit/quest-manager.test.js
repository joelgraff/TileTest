import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuestManager from '../../questManager.js';

describe('QuestManager completion flow', () => {
    let originalDocument;

    beforeEach(() => {
        originalDocument = globalThis.document;
        globalThis.document = { cookie: '' };
    });

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    it('awards score and shows completion when a quest finishes', () => {
        const manager = new QuestManager();
        const addScore = vi.fn();
        const showQuestCompletion = vi.fn();

        manager.uiManager = {
            addScore,
            showQuestCompletion
        };

        manager.activeQuests = [{
            id: 'quest-1',
            title: 'Collect Test Items',
            reward: {
                points: 30,
                description: '30 points'
            },
            objectives: []
        }];

        manager.completeQuest('quest-1');

        expect(addScore).toHaveBeenCalledWith(30);
        expect(showQuestCompletion).toHaveBeenCalledTimes(1);
        expect(manager.activeQuests).toHaveLength(0);
        expect(manager.completedQuests).toHaveLength(1);
        expect(manager.completedQuests[0].completed).toBe(true);
    });
});