import { describe, expect, it } from 'vitest';

import { createEncounterChain, createEncounterChains, getEncounterForVendor } from '../../encounterChain.js';

function createDiscoveryQuest({ ordered = false, completed = false, firstVisited = false } = {}) {
    return {
        id: 'discovery-1',
        type: 'discovery',
        title: 'Ordered Trail',
        trailId: 'ordered-trail',
        ordered,
        completed,
        objectives: [
            {
                trailStopId: 'stop-1',
                vendorId: 'vendor-1',
                vendorName: 'Vendor One',
                booth: 'A1',
                clue: 'Find the first booth.',
                goal: 'Ask about stop one.',
                visited: firstVisited,
                visitedAt: firstVisited ? 111 : null
            },
            {
                trailStopId: 'stop-2',
                vendorId: 'vendor-2',
                vendorName: 'Vendor Two',
                booth: 'A2',
                clue: 'Find the second booth.',
                goal: 'Ask about stop two.',
                visited: false,
                visitedAt: null
            }
        ]
    };
}

describe('encounter chain model', () => {
    it('marks every unvisited unordered discovery stop as available', () => {
        const chain = createEncounterChain(createDiscoveryQuest());

        expect(chain).toMatchObject({
            questId: 'discovery-1',
            trailId: 'ordered-trail',
            title: 'Ordered Trail',
            ordered: false,
            status: 'active',
            visitedCount: 0,
            totalCount: 2
        });
        expect(chain.availableEncounters.map(encounter => encounter.vendorId)).toEqual(['vendor-1', 'vendor-2']);
        expect(chain.lockedEncounters).toEqual([]);
        expect(chain.nextEncounter.vendorId).toBe('vendor-1');
    });

    it('locks later ordered discovery stops until the next open stop is complete', () => {
        const chain = createEncounterChain(createDiscoveryQuest({ ordered: true }));

        expect(chain.availableEncounters.map(encounter => encounter.vendorId)).toEqual(['vendor-1']);
        expect(chain.lockedEncounters.map(encounter => encounter.vendorId)).toEqual(['vendor-2']);
        expect(getEncounterForVendor(createDiscoveryQuest({ ordered: true }), 'vendor-2')).toMatchObject({
            vendorId: 'vendor-2',
            status: 'locked',
            locked: true
        });
    });

    it('unlocks the next ordered stop after the prior stop is visited', () => {
        const chain = createEncounterChain(createDiscoveryQuest({ ordered: true, firstVisited: true }));

        expect(chain.completedEncounters.map(encounter => encounter.vendorId)).toEqual(['vendor-1']);
        expect(chain.availableEncounters.map(encounter => encounter.vendorId)).toEqual(['vendor-2']);
        expect(chain.lockedEncounters).toEqual([]);
        expect(chain.nextEncounter).toMatchObject({
            vendorId: 'vendor-2',
            status: 'available'
        });
    });

    it('creates chains from active and completed discovery quests only', () => {
        const chains = createEncounterChains({
            completedQuests: [createDiscoveryQuest({ completed: true, firstVisited: true })],
            activeQuests: [createDiscoveryQuest(), { type: 'collection', objectives: [] }]
        });

        expect(chains).toHaveLength(2);
        expect(chains.map(chain => chain.title)).toEqual(['Ordered Trail', 'Ordered Trail']);
    });
});