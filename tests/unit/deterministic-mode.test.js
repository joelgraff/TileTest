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
            scene: {
                testMode: true,
                npcGroup: {
                    getChildren: () => npcs
                },
                add: {
                    graphics: () => ({ ...graphicsStub })
                }
            },
            vendors,
            vendorAssignmentDone: false,
            getAssignedVendor: VendorManager.prototype.getAssignedVendor
        };

        VendorManager.prototype.assignVendorsToNPCs.call(context);

        expect(npcs[0].vendorData).toBe(vendors[0]);
        expect(npcs[1].vendorData).toBe(vendors[1]);
        expect(npcs[2].vendorData).toBe(vendors[0]);
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

        const manager = new QuestManager();
        manager.scene = { testMode: true };
        manager.vendors = [
            { id: 'v1', domain_id: 'alpha' },
            { id: 'v2', domain_id: 'beta' }
        ];

        const quest = manager.generateCollectionQuest();

        expect(quest.id).toBe('test_quest_1');
        expect(quest.domain).toBe('alpha');
        expect(quest.objectives.map(objective => objective.item.name)).toEqual([
            'Alpha Item 1',
            'Alpha Item 2',
            'Alpha Item 3'
        ]);

        DomainManager.domains = null;
    });
});