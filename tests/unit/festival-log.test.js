import { describe, expect, it } from 'vitest';

import { createFestivalLog, hasFestivalLogActivity } from '../../festivalLog.js';

describe('festival log model', () => {
    it('summarizes completed authored discovery trails and collected session state', () => {
        const log = createFestivalLog({
            score: 42,
            inventory: [{
                id: 'badge-1',
                name: 'Show Badge',
                description: 'A logged souvenir.',
                value: 5
            }],
            activeQuests: [],
            completedQuests: [{
                id: 'quest-1',
                type: 'discovery',
                source: 'authored-trail',
                trailId: 'starter-trail',
                title: 'Starter Trail',
                description: 'Visit starter exhibitors.',
                completionText: 'Starter trail complete.',
                completed: true,
                completedAt: 12345,
                objectives: [
                    {
                        trailStopId: 'stop-1',
                        vendorId: 'vendor-1',
                        vendorName: 'Vendor One',
                        booth: 'A1',
                        clue: 'Ask about the disk bench.',
                        goal: 'Find the newest repair story.',
                        visited: true,
                        visitedAt: 111
                    },
                    {
                        trailStopId: 'stop-2',
                        vendorId: 'vendor-2',
                        vendorName: 'Vendor Two',
                        booth: 'B2',
                        clue: 'Look for the playable demo.',
                        goal: 'Ask what system it targets.',
                        visited: true,
                        visitedAt: 222
                    }
                ],
                reward: {
                    points: 30,
                    description: '30 points for the starter trail'
                }
            }]
        });

        expect(hasFestivalLogActivity(log)).toBe(true);
        expect(log).toMatchObject({
            score: 42,
            completedQuestCount: 1,
            completedTrailCount: 1,
            activeTrailCount: 0,
            stampCount: 2,
            collectedItemCount: 1,
            rewardPoints: 30
        });
        expect(log.completedDiscoveryTrails[0]).toMatchObject({
            questId: 'quest-1',
            trailId: 'starter-trail',
            source: 'authored-trail',
            title: 'Starter Trail',
            status: 'completed',
            completionText: 'Starter trail complete.',
            rewardPoints: 30,
            visitedCount: 2,
            totalCount: 2
        });
        expect(log.stamps.map(stamp => stamp.vendorId)).toEqual(['vendor-1', 'vendor-2']);
        expect(log.stamps[0]).toMatchObject({
            trailTitle: 'Starter Trail',
            trailStatus: 'completed',
            trailStopId: 'stop-1',
            clue: 'Ask about the disk bench.',
            goal: 'Find the newest repair story.'
        });
        expect(log.collectedItems[0]).toMatchObject({
            id: 'badge-1',
            name: 'Show Badge',
            value: 5
        });
    });

    it('keeps in-progress discovery stamps without logging unvisited stops', () => {
        const log = createFestivalLog({
            activeQuests: [{
                id: 'quest-1',
                type: 'discovery',
                title: 'Discovery Passport',
                completed: false,
                objectives: [
                    {
                        vendorId: 'vendor-1',
                        vendorName: 'Vendor One',
                        clue: 'Already found.',
                        visited: true
                    },
                    {
                        vendorId: 'vendor-2',
                        vendorName: 'Vendor Two',
                        clue: 'Still hidden.',
                        visited: false
                    }
                ],
                reward: { points: 30 }
            }]
        });

        expect(hasFestivalLogActivity(log)).toBe(true);
        expect(log.activeTrailCount).toBe(1);
        expect(log.completedTrailCount).toBe(0);
        expect(log.stampCount).toBe(1);
        expect(log.stamps).toEqual([
            expect.objectContaining({
                vendorId: 'vendor-1',
                visited: true,
                trailStatus: 'active'
            })
        ]);
    });

    it('reports no activity for an empty session', () => {
        const log = createFestivalLog();

        expect(hasFestivalLogActivity(log)).toBe(false);
        expect(log.stampCount).toBe(0);
        expect(log.completedDiscoveryTrails).toEqual([]);
        expect(log.collectedItems).toEqual([]);
    });
});