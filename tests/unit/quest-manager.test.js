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

    it('prefers reachable authored discovery trails over generated vendor selection', () => {
        DomainManager.domains = [{
            id: 'retro',
            name: 'Retro Computing',
            items: [{ id: 'item-1', name: 'Disk Imager' }],
            facts: []
        }];
        const vendors = [
            { id: 'vendor-1', name: 'Vendor One', booth: 'A1', domain_id: 'retro', clueText: 'Vendor clue one' },
            { id: 'vendor-2', name: 'Vendor Two', booth: 'A2', domain_id: 'retro', clueText: 'Vendor clue two' },
            { id: 'vendor-3', name: 'Vendor Three', booth: 'A3', domain_id: 'retro' }
        ];
        const manager = new QuestManager({
            testMode: true,
            discoveryTrails: [{
                id: 'trail-1',
                title: 'Starter Trail',
                description: 'Visit the authored trail vendors.',
                ordered: true,
                stops: [
                    {
                        id: 'stop-2',
                        vendorId: 'vendor-2',
                        clueText: 'Authored clue two',
                        goalText: 'Ask about the second stop.'
                    },
                    {
                        id: 'stop-1',
                        vendorId: 'vendor-1',
                        clueText: 'Authored clue one',
                        goalText: 'Ask about the first stop.'
                    }
                ],
                reward: {
                    points: 45,
                    description: '45 points for the authored trail'
                },
                completionText: 'Trail complete.'
            }]
        });

        manager.vendors = vendors;
        manager.setDiscoveryVendorPool([vendors[0], vendors[1], vendors[2]]);
        manager.generateInitialQuests();

        const discoveryQuest = manager.activeQuests.find(quest => quest.type === 'discovery');

        expect(discoveryQuest).toMatchObject({
            source: 'authored-trail',
            trailId: 'trail-1',
            title: 'Starter Trail',
            description: 'Visit the authored trail vendors.',
            ordered: true,
            completionText: 'Trail complete.',
            reward: {
                points: 45,
                description: '45 points for the authored trail'
            }
        });
        expect(discoveryQuest.objectives).toEqual([
            expect.objectContaining({
                trailStopId: 'stop-2',
                vendorId: 'vendor-2',
                vendorName: 'Vendor Two',
                clue: 'Authored clue two',
                goal: 'Ask about the second stop.'
            }),
            expect.objectContaining({
                trailStopId: 'stop-1',
                vendorId: 'vendor-1',
                vendorName: 'Vendor One',
                clue: 'Authored clue one',
                goal: 'Ask about the first stop.'
            })
        ]);
    });

    it('falls back to generated discovery when authored trails are not reachable', () => {
        DomainManager.domains = [{
            id: 'retro',
            name: 'Retro Computing',
            items: [{ id: 'item-1', name: 'Disk Imager' }],
            facts: []
        }];
        const vendors = [
            { id: 'vendor-1', name: 'Vendor One', booth: 'A1', domain_id: 'retro' },
            { id: 'vendor-2', name: 'Vendor Two', booth: 'A2', domain_id: 'retro' }
        ];
        const manager = new QuestManager({
            testMode: true,
            discoveryTrails: [{
                id: 'unreachable-trail',
                title: 'Unreachable Trail',
                description: 'This should be skipped.',
                stops: [
                    { id: 'known', vendorId: 'vendor-1', clueText: 'Known clue', goalText: 'Known goal' },
                    { id: 'missing', vendorId: 'vendor-404', clueText: 'Missing clue', goalText: 'Missing goal' }
                ],
                reward: { points: 30, description: '30 points' }
            }]
        });

        manager.vendors = vendors;
        manager.setDiscoveryVendorPool(vendors);
        manager.generateInitialQuests();

        const discoveryQuest = manager.activeQuests.find(quest => quest.type === 'discovery');

        expect(discoveryQuest.source).toBeUndefined();
        expect(discoveryQuest.trailId).toBeUndefined();
        expect(discoveryQuest.title).toBe('Discovery Passport');
        expect(discoveryQuest.objectives.map(objective => objective.vendorId)).toEqual(['vendor-1', 'vendor-2']);
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

        const firstVisitResult = manager.checkVendorDiscoveryResult('vendor-1', {
            id: 'vendor-1',
            name: 'Vendor One Live',
            booth: 'B1',
            clueText: 'Live clue text'
        });

        expect(firstVisitResult).toMatchObject({
            updated: true,
            questCompleted: false,
            questId: 'discovery-1',
            questTitle: 'Discovery Passport',
            vendorId: 'vendor-1',
            vendorName: 'Vendor One Live',
            booth: 'B1',
            clue: 'Live clue text',
            visitedCount: 1,
            totalCount: 2
        });
        expect(firstVisitResult.message).toContain('Passport stamp earned: Vendor One Live (B1)');
        expect(firstVisitResult.message).toContain('Discovery Passport progress: 1/2 vendors visited.');
        expect(manager.activeQuests[0].objectives[0]).toMatchObject({
            vendorName: 'Vendor One Live',
            booth: 'B1',
            clue: 'Live clue text',
            visited: true
        });
        expect(manager.completedQuests).toHaveLength(0);

        expect(manager.checkVendorDiscovery('vendor-1')).toBe(false);
        expect(manager.checkVendorDiscoveryResult('vendor-1')).toMatchObject({
            updated: false,
            questCompleted: false,
            message: ''
        });
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