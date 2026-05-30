import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DomainManager from '../../domainManager.js';
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
        DomainManager.domains = null;
    });

    it('awards score and shows completion when a quest finishes', () => {
        const manager = new QuestManager();
        const handleQuestCompletion = vi.fn();

        manager.setQuestCompletionHandler(handleQuestCompletion);

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

        expect(handleQuestCompletion).toHaveBeenCalledTimes(1);
        expect(handleQuestCompletion).toHaveBeenCalledWith(expect.objectContaining({
            id: 'quest-1',
            completed: true
        }));
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
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        globalThis.document.cookie = 'vcf_quest_session={invalid-json}; path=/';

        expect(() => manager.loadSessionState()).not.toThrow();
        expect(warn).toHaveBeenCalled();
        expect(manager.sessionId).toBeNull();
        expect(manager.activeQuests).toEqual([]);
        expect(manager.completedQuests).toEqual([]);
    });

    it('skips cookie persistence in test mode', () => {
        const manager = new QuestManager({ testMode: true });
        manager.sessionId = 'test-session';
        manager.activeQuests = [{ id: 'active-1' }];

        manager.saveSessionState();

        expect(globalThis.document.cookie).toBe('');

        globalThis.document.cookie = 'vcf_quest_session={"sessionId":"persisted"}; path=/';
        manager.loadSessionState();

        expect(manager.sessionId).toBe('test-session');
        expect(manager.activeQuests).toEqual([{ id: 'active-1' }]);
    });

    it('generates a discovery passport from assigned vendors alongside collection quests', () => {
        DomainManager.domains = [{
            id: 'retro',
            name: 'Retro Computing',
            items: [{ id: 'item-1', name: 'Disk Imager' }],
            facts: []
        }];
        const manager = new QuestManager({ testMode: true });
        const vendors = [
            { id: 'vendor-1', name: 'Vendor One', booth: 'A1', domain_id: 'retro', clueText: 'Find the disk bench.' },
            { id: 'vendor-2', name: 'Vendor Two', booth: 'A2', domain_id: 'retro' },
            { id: 'vendor-3', name: 'Vendor Three', booth: 'A3', domain_id: 'retro' }
        ];

        manager.vendors = vendors;
        manager.setDiscoveryVendorPool([vendors[1], vendors[0]]);
        manager.generateInitialQuests();

        expect(manager.activeQuests.map(quest => quest.type)).toEqual(['collection', 'discovery']);

        const discoveryQuest = manager.activeQuests.find(quest => quest.type === 'discovery');

        expect(discoveryQuest.objectives).toEqual([
            expect.objectContaining({
                vendorId: 'vendor-2',
                vendorName: 'Vendor Two',
                booth: 'A2',
                clue: 'Visit Vendor Two at A2 and ask what makes their exhibit stand out.',
                visited: false
            }),
            expect.objectContaining({
                vendorId: 'vendor-1',
                vendorName: 'Vendor One',
                booth: 'A1',
                clue: 'Find the disk bench.',
                visited: false
            })
        ]);
    });

    it('skips discovery passports when the assigned vendor pool is too small', () => {
        DomainManager.domains = [{
            id: 'retro',
            name: 'Retro Computing',
            items: [{ id: 'item-1', name: 'Disk Imager' }],
            facts: []
        }];
        const manager = new QuestManager({ testMode: true });
        const vendors = [
            { id: 'vendor-1', name: 'Vendor One', booth: 'A1', domain_id: 'retro' },
            { id: 'vendor-2', name: 'Vendor Two', booth: 'A2', domain_id: 'retro' }
        ];

        manager.vendors = vendors;
        manager.setDiscoveryVendorPool([vendors[0], vendors[0]]);
        manager.generateInitialQuests();

        expect(manager.activeQuests.map(quest => quest.type)).toEqual(['collection']);
    });

    it('marks discovery objectives from vendor visits and completes the passport', () => {
        const manager = new QuestManager();
        const handleQuestCompletion = vi.fn();
        const saveSessionState = vi.spyOn(manager, 'saveSessionState').mockImplementation(() => {});

        manager.setQuestCompletionHandler(handleQuestCompletion);
        manager.activeQuests = [{
            id: 'discovery-1',
            type: 'discovery',
            title: 'Discovery Passport',
            objectives: [
                {
                    vendorId: 'vendor-1',
                    vendorName: 'Vendor One',
                    booth: 'A1',
                    clue: 'Fallback clue',
                    visited: false,
                    visitedAt: null
                },
                {
                    vendorId: 'vendor-2',
                    vendorName: 'Vendor Two',
                    booth: 'A2',
                    clue: 'Second clue',
                    visited: false,
                    visitedAt: null
                }
            ],
            reward: {
                points: 30,
                description: '30 points'
            }
        }];

        expect(manager.checkVendorDiscovery('vendor-1', {
            id: 'vendor-1',
            name: 'Vendor One Live',
            booth: 'B1',
            clueText: 'Live clue text'
        })).toBe(true);
        expect(manager.activeQuests[0].objectives[0]).toMatchObject({
            vendorName: 'Vendor One Live',
            booth: 'B1',
            clue: 'Live clue text',
            visited: true
        });
        expect(manager.completedQuests).toHaveLength(0);

        expect(manager.checkVendorDiscovery('vendor-1')).toBe(false);
        expect(manager.checkVendorDiscovery('vendor-2', { id: 'vendor-2' })).toBe(true);

        expect(manager.activeQuests).toHaveLength(0);
        expect(manager.completedQuests).toHaveLength(1);
        expect(handleQuestCompletion).toHaveBeenCalledWith(expect.objectContaining({
            id: 'discovery-1',
            completed: true
        }));
        expect(saveSessionState).toHaveBeenCalled();
    });
});