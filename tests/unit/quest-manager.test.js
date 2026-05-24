import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuestManager from '../../questManager.js';

describe('QuestManager completion flow', () => {
    let originalDocument;

    beforeEach(() => {
        originalDocument = globalThis.document;
        globalThis.document = { cookie: '' };
    });

    afterEach(() => {
        vi.restoreAllMocks();
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

    it('marks matching collection objectives and records the vendor', () => {
        const manager = new QuestManager();
        const saveSessionState = vi.spyOn(manager, 'saveSessionState').mockImplementation(() => {});

        manager.activeQuests = [{
            id: 'quest-1',
            type: 'collection',
            objectives: [
                {
                    item: { name: 'Panel Item' },
                    collected: false,
                    vendor: null
                },
                {
                    item: { name: 'Other Item' },
                    collected: false,
                    vendor: null
                }
            ]
        }];

        const questUpdated = manager.checkItemCollection('Panel Item', 'vendor-1');

        expect(questUpdated).toBe(true);
        expect(manager.activeQuests[0].objectives[0]).toMatchObject({
            collected: true,
            vendor: 'vendor-1'
        });
        expect(manager.activeQuests[0].objectives[1].collected).toBe(false);
        expect(manager.completedQuests).toHaveLength(0);
        expect(saveSessionState).toHaveBeenCalledTimes(1);
    });

    it('persists and restores session state through the quest cookie', () => {
        const manager = new QuestManager();
        manager.sessionId = 'session-123';
        manager.activeQuests = [{ id: 'active-1', title: 'Active Quest' }];
        manager.completedQuests = [{ id: 'done-1', title: 'Done Quest', completed: true }];

        manager.saveSessionState();

        expect(globalThis.document.cookie).toContain('vcf_quest_session=');

        const restoredManager = new QuestManager();
        restoredManager.loadSessionState();

        expect(restoredManager.sessionId).toBe('session-123');
        expect(restoredManager.activeQuests).toEqual([{ id: 'active-1', title: 'Active Quest' }]);
        expect(restoredManager.completedQuests).toEqual([
            { id: 'done-1', title: 'Done Quest', completed: true }
        ]);
    });

    it('ignores invalid quest session cookies', () => {
        const manager = new QuestManager();
        globalThis.document.cookie = 'vcf_quest_session={invalid-json}; path=/';

        expect(() => manager.loadSessionState()).not.toThrow();
        expect(manager.sessionId).toBeNull();
        expect(manager.activeQuests).toEqual([]);
        expect(manager.completedQuests).toEqual([]);
    });

    it('skips cookie persistence in test mode', () => {
        const manager = new QuestManager();
        manager.scene = { testMode: true };
        manager.sessionId = 'test-session';
        manager.activeQuests = [{ id: 'active-1' }];

        manager.saveSessionState();

        expect(globalThis.document.cookie).toBe('');

        globalThis.document.cookie = 'vcf_quest_session={"sessionId":"persisted"}; path=/';
        manager.loadSessionState();

        expect(manager.sessionId).toBe('test-session');
        expect(manager.activeQuests).toEqual([{ id: 'active-1' }]);
    });
});