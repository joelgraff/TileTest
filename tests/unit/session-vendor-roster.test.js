import { describe, expect, it } from 'vitest';

import {
    getSavedActiveVendorIds,
    getVendorsForSessionVendorIds,
    resolveSessionVendorIds
} from '../../sessionVendorRoster.js';

const vendors = [
    { id: 'vendor-1', name: 'Vendor 1' },
    { id: 'vendor-2', name: 'Vendor 2' },
    { id: 'vendor-3', name: 'Vendor 3' },
    { id: 'vendor-4', name: 'Vendor 4' }
];

describe('session vendor roster', () => {
    it('uses the first map-sized vendor set in test mode', () => {
        expect(resolveSessionVendorIds({
            vendors,
            npcCount: 2,
            testMode: true
        })).toEqual(['vendor-1', 'vendor-2']);
    });

    it('reuses saved vendor ids before filling remaining map slots', () => {
        expect(resolveSessionVendorIds({
            vendors,
            npcCount: 3,
            savedVendorIds: ['vendor-3', 'missing-vendor', 'vendor-3'],
            testMode: true
        })).toEqual(['vendor-3', 'vendor-1', 'vendor-2']);
    });

    it('selects vendors zone by zone and leaves underfilled slots empty', () => {
        const zoneVendors = [
            { id: 'vendor-a-1', booth: 'A01' },
            { id: 'vendor-b-1', booth: 'B01' },
            { id: 'vendor-b-2', booth: 'B02' },
            { id: 'vendor-b-3', booth: 'B03' }
        ];

        expect(resolveSessionVendorIds({
            vendors: zoneVendors,
            zoneRequirements: [
                { zone: 'A', spawnPoints: [{}, {}] },
                { zone: 'B', spawnPoints: [{}, {}] }
            ],
            testMode: true
        })).toEqual([
            'vendor-a-1',
            'vendor-b-1',
            'vendor-b-2'
        ]);
    });

    it('keeps saved ids inside their matching zone before filling the remaining slots', () => {
        const zoneVendors = [
            { id: 'vendor-a-1', booth: 'A01' },
            { id: 'vendor-b-1', booth: 'B01' },
            { id: 'vendor-a-2', booth: 'A02' },
            { id: 'vendor-b-2', booth: 'B02' },
            { id: 'vendor-b-3', booth: 'B03' }
        ];

        expect(resolveSessionVendorIds({
            vendors: zoneVendors,
            zoneRequirements: [
                { zone: 'A', spawnPoints: [{}, {}] },
                { zone: 'B', spawnPoints: [{}, {}, {}] }
            ],
            savedVendorIds: ['vendor-b-3', 'vendor-a-2', 'vendor-b-1'],
            testMode: true
        })).toEqual([
            'vendor-a-2',
            'vendor-a-1',
            'vendor-b-3',
            'vendor-b-1',
            'vendor-b-2'
        ]);
    });

    it('limits normal mode rosters to unique vendors for available NPC slots', () => {
        const roster = resolveSessionVendorIds({
            vendors,
            npcCount: 3,
            random: () => 0
        });

        expect(roster).toHaveLength(3);
        expect(new Set(roster).size).toBe(3);
        expect(roster.every(vendorId => vendors.some(vendor => vendor.id === vendorId))).toBe(true);
    });

    it('resolves saved ids back to vendor records in saved order', () => {
        expect(getVendorsForSessionVendorIds(vendors, ['vendor-3', 'missing-vendor', 'vendor-1']).map(vendor => vendor.id)).toEqual([
            'vendor-3',
            'vendor-1'
        ]);
    });

    it('falls back to legacy quest objective vendors when a cookie has no roster field', () => {
        const documentRef = {
            cookie: 'vcf_quest_session={"sessionId":"legacy","activeQuests":[{"objectives":[{"vendorId":"vendor-2"},{"vendor":"vendor-4"}]}],"completedQuests":[]}'
        };

        expect(getSavedActiveVendorIds({ documentRef })).toEqual(['vendor-2', 'vendor-4']);
    });
});
