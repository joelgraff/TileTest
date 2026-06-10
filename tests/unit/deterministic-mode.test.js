import { describe, expect, it } from 'vitest';

import DomainManager from '../../domainManager.js';
import QuestManager from '../../questManager.js';
import VendorManager from '../../vendorManager.js';

describe('deterministic test mode', () => {
    it('assigns vendors to NPCs in a stable order when test mode is enabled', () => {
        const vendors = [
            { id: 'vendor-1', name: 'Vendor 1' },
            { id: 'vendor-2', name: 'Vendor 2' }
        ];
        const npcs = [{}, {}, {}];
        const graphicsStub = {
            setDepth() {
                return this;
            },
            setVisible() {
                return this;
            }
        };
        const context = {
            npcGroup: {
                getChildren: () => npcs
            },
            gameObjectFactory: {
                graphics: () => ({ ...graphicsStub })
            },
            testMode: true,
            vendors,
            vendorAssignmentDone: false,
            getNPCSprites: VendorManager.prototype.getNPCSprites,
            getAssignedVendor: VendorManager.prototype.getAssignedVendor
        };

        VendorManager.prototype.assignVendorsToNPCs.call(context);

        expect(npcs[0].vendorData).toBe(vendors[0]);
        expect(npcs[1].vendorData).toBe(vendors[1]);
        expect(npcs[2].vendorData).toBe(vendors[0]);
    });

    it('uses every vendor once before repeating random assignments outside test mode', () => {
        const vendors = [
            { id: 'vendor-1', name: 'Vendor 1' },
            { id: 'vendor-2', name: 'Vendor 2' },
            { id: 'vendor-3', name: 'Vendor 3' }
        ];
        const context = {
            testMode: false,
            vendors,
            randomVendorOrder: null,
            getRandomVendorOrder: VendorManager.prototype.getRandomVendorOrder
        };
        const assignedVendors = [0, 1, 2].map(index => VendorManager.prototype.getAssignedVendor.call(context, index));

        expect(new Set(assignedVendors)).toEqual(new Set(vendors));
        expect(VendorManager.prototype.getAssignedVendor.call(context, 3)).toBe(assignedVendors[0]);
    });

    it('assigns vendors from the persisted session roster before using the full list', () => {
        const vendors = [
            { id: 'vendor-1', name: 'Vendor 1' },
            { id: 'vendor-2', name: 'Vendor 2' },
            { id: 'vendor-3', name: 'Vendor 3' }
        ];
        const context = {
            testMode: false,
            vendors,
            randomVendorOrder: null,
            setSessionVendorIds: VendorManager.prototype.setSessionVendorIds,
            getAssignmentVendorPool: VendorManager.prototype.getAssignmentVendorPool,
            getRandomVendorOrder: VendorManager.prototype.getRandomVendorOrder
        };

        VendorManager.prototype.setSessionVendorIds.call(context, ['vendor-3', 'vendor-1']);

        expect(VendorManager.prototype.getAssignedVendor.call(context, 0)).toBe(vendors[2]);
        expect(VendorManager.prototype.getAssignedVendor.call(context, 1)).toBe(vendors[0]);
        expect(VendorManager.prototype.getAssignedVendor.call(context, 2)).toBe(vendors[2]);
    });

    it('leaves zone-tagged scenes underfilled in test mode instead of backfilling from the full vendor list', () => {
        const vendors = [
            { id: 'vendor-a-1', name: 'Vendor A1', booth: 'A01' },
            { id: 'vendor-a-2', name: 'Vendor A2', booth: 'A02' },
            { id: 'vendor-b-1', name: 'Vendor B1', booth: 'B01' },
            { id: 'vendor-b-2', name: 'Vendor B2', booth: 'B02' }
        ];
        const zoneASprites = [{ spawnZone: 'A' }, { spawnZone: 'A' }];
        const zoneBSprites = [{ spawnZone: 'B' }, { spawnZone: 'B' }];
        const context = {
            npcGroup: {
                getChildren: () => [...zoneASprites, ...zoneBSprites]
            },
            gameObjectFactory: {
                graphics: () => ({
                    setDepth() {
                        return this;
                    },
                    setVisible() {
                        return this;
                    }
                })
            },
            testMode: true,
            vendors,
            sessionVendors: [vendors[0], vendors[2]],
            vendorAssignmentDone: false,
            getNPCSprites: VendorManager.prototype.getNPCSprites
        };

        VendorManager.prototype.assignVendorsToNPCs.call(context);

        expect(zoneASprites.map(sprite => sprite.vendorData?.id ?? null)).toEqual(['vendor-a-1', null]);
        expect(zoneBSprites.map(sprite => sprite.vendorData?.id ?? null)).toEqual(['vendor-b-1', null]);
    });

    it('generates a stable first quest in test mode', () => {
        DomainManager.domains = [
            {
                id: 'alpha',
                name: 'Alpha',
                items: [
                    { id: 'alpha-1', name: 'Alpha Item 1' },
                    { id: 'alpha-2', name: 'Alpha Item 2' },
                    { id: 'alpha-3', name: 'Alpha Item 3' }
                ],
                facts: []
            },
            {
                id: 'beta',
                name: 'Beta',
                items: [{ id: 'beta-1', name: 'Beta Item 1' }],
                facts: []
            }
        ];

        const manager = new QuestManager({ testMode: true });
        manager.vendors = [
            { id: 'v1', domain_id: 'alpha' },
            { id: 'v2', domain_id: 'beta' }
        ];

        const quest = manager.generateCollectionQuest();

        expect(quest.id).toBe('test_quest_1');
        expect(quest.domain).toBe('show_floor');
        expect(quest.title).toBe('Collect Show Floor Treasures');
        expect(quest.objectives.map(objective => objective.item.name)).toEqual([
            'Alpha Item 3',
            'Beta Item 1'
        ]);
        expect(quest.objectives.map(objective => objective.vendorId)).toEqual([
            'v1',
            'v2'
        ]);

        DomainManager.domains = null;
    });
});