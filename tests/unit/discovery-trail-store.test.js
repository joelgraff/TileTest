import { describe, expect, it } from 'vitest';

import {
    DiscoveryTrailStore,
    normalizeDiscoveryTrailEntry,
    normalizeDiscoveryTrailSnapshot
} from '../../discoveryTrailStore.js';

describe('discovery trail store', () => {
    it('normalizes authored discovery trail entries for QuestManager consumption', () => {
        expect(normalizeDiscoveryTrailEntry({
            trailId: 100,
            title: ' Live Trail ',
            description: ' Visit booths. ',
            ordered: 'true',
            objectives: [
                { vendor_id: 100, clue: ' Ask about disks. ', goal: ' Find a demo. ' },
                { vendorId: '101', clueText: 'Look for games.', goalText: 'Ask what is playable.' },
                { vendorId: '101', clueText: 'Duplicate ignored.' }
            ],
            rewardPoints: '45',
            rewardDescription: ' Live reward. ',
            completionText: ' Done. '
        })).toEqual({
            id: '100',
            title: 'Live Trail',
            description: 'Visit booths.',
            ordered: true,
            stops: [
                {
                    id: 'stop-1',
                    vendorId: '100',
                    clueText: 'Ask about disks.',
                    goalText: 'Find a demo.'
                },
                {
                    id: 'stop-2',
                    vendorId: '101',
                    clueText: 'Look for games.',
                    goalText: 'Ask what is playable.'
                }
            ],
            reward: {
                points: 45,
                description: 'Live reward.'
            },
            completionText: 'Done.'
        });
    });

    it('filters invalid trails from snapshots', () => {
        expect(normalizeDiscoveryTrailSnapshot({
            trails: [
                { id: 'missing-stops', stops: [{ vendorId: '100' }] },
                {
                    id: 'valid',
                    title: 'Valid Trail',
                    stops: [{ vendorId: '100' }, { vendorId: '101' }]
                }
            ]
        })).toEqual([
            expect.objectContaining({
                id: 'valid',
                title: 'Valid Trail',
                stops: [
                    expect.objectContaining({ vendorId: '100' }),
                    expect.objectContaining({ vendorId: '101' })
                ]
            })
        ]);
    });

    it('stores, replaces, and serializes trails by id', () => {
        const store = new DiscoveryTrailStore([{
            id: 'starter',
            title: 'Starter Trail',
            stops: [{ vendorId: '100' }, { vendorId: '101' }]
        }]);

        expect(store.applyUpdate({
            id: 'starter',
            title: 'Updated Starter Trail',
            ordered: true,
            stops: [{ vendorId: '100' }, { vendorId: '102' }],
            reward: { points: 60, description: '60 points' }
        })).toMatchObject({
            id: 'starter',
            title: 'Updated Starter Trail',
            ordered: true,
            reward: { points: 60 }
        });
        expect(store.toJSON()).toEqual({
            trails: [expect.objectContaining({
                id: 'starter',
                title: 'Updated Starter Trail',
                stops: [
                    expect.objectContaining({ vendorId: '100' }),
                    expect.objectContaining({ vendorId: '102' })
                ]
            })]
        });

        store.replaceSnapshot({
            discoveryTrails: [{ id: 'other', stops: [{ vendorId: '200' }, { vendorId: '201' }] }]
        });

        expect(store.getTrails().map(trail => trail.id)).toEqual(['other']);
        expect(store.applyUpdate({ id: 'broken', stops: [{ vendorId: '100' }] })).toBeNull();
    });
});