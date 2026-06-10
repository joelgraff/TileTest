import { afterEach, describe, expect, it, vi } from 'vitest';

import DomainManager from '../../domainManager.js';
import VendorManager from '../../vendorManager.js';

describe('VendorManager collaborators', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
        DomainManager.domains = null;
    });

    it('updates nearby vendor label through injected player, npc group, and camera collaborators', () => {
        DomainManager.domains = [];

        const interactionPrompt = {
            setText: vi.fn(function () { return this; }),
            setVisible: vi.fn(function () { return this; })
        };
        const farVendor = {
            x: 220,
            y: 240,
            vendorData: { id: 'vendor-2', name: 'Vendor Two', booth: 'B2' },
            displayWidth: 32
        };
        const nearVendor = {
            x: 170,
            y: 100,
            vendorData: { id: 'vendor-1', name: 'Vendor One', booth: 'A1' },
            displayWidth: 32
        };
        const context = {
            assignVendorsToNPCs: vi.fn(),
            getNPCSprites: () => [farVendor, nearVendor],
            interactionRange: 96,
            nearbyVendor: null,
            interactionPrompt,
            updateInteractionPrompt: VendorManager.prototype.updateInteractionPrompt,
            npcGroup: { getChildren: () => [farVendor, nearVendor] },
            player: { x: 100, y: 100 },
            camera: { scrollX: 10, scrollY: 15 },
            scene: {
                activeNpcSprites: [farVendor, nearVendor]
            },
            isInteractionAvailable: () => true
        };

        VendorManager.prototype.update.call(context);

        expect(context.assignVendorsToNPCs).toHaveBeenCalledTimes(1);
        expect(context.nearbyVendor).toBe(nearVendor);
        expect(interactionPrompt.setText).toHaveBeenCalledWith('Vendor One\nBooth A1');
        expect(interactionPrompt.setVisible).toHaveBeenLastCalledWith(true);
    });

    it('skips sleeping vendors when the active NPC list excludes them', () => {
        DomainManager.domains = [];

        const sleepingVendor = {
            x: 110,
            y: 110,
            body: { enable: false },
            vendorData: { id: 'vendor-sleeping' },
            displayWidth: 32
        };
        const activeVendor = {
            x: 180,
            y: 180,
            body: { enable: true },
            vendorData: { id: 'vendor-active' },
            displayWidth: 32
        };
        const interactionPrompt = {
            setText: vi.fn(function () { return this; }),
            setVisible: vi.fn(function () { return this; })
        };
        const context = {
            assignVendorsToNPCs: vi.fn(),
            getNPCSprites: () => [sleepingVendor, activeVendor],
            interactionRange: 120,
            nearbyVendor: null,
            interactionPrompt,
            updateInteractionPrompt: VendorManager.prototype.updateInteractionPrompt,
            npcGroup: { getChildren: () => [sleepingVendor, activeVendor] },
            player: { x: 100, y: 100 },
            camera: { scrollX: 0, scrollY: 0 },
            scene: {
                activeNpcSprites: [activeVendor]
            },
            isInteractionAvailable: () => true
        };

        VendorManager.prototype.update.call(context);

        expect(context.nearbyVendor).toBe(activeVendor);
        expect(interactionPrompt.setVisible).toHaveBeenLastCalledWith(true);
    });

    it('assigns vendors to matching zone layers and skips booth zones without layers', () => {
        DomainManager.domains = [];

        const zoneASpriteOne = { spawnZone: 'A' };
        const zoneASpriteTwo = { spawnZone: 'A' };
        const zoneBSprite = { spawnZone: 'B' };
        const zoneCSprite = { spawnZone: 'C' };
        const vendors = [
            { id: 'vendor-a-1', name: 'Vendor A1', booth: 'A11/A12' },
            { id: 'vendor-a-2', name: 'Vendor A2', booth: 'A13' },
            { id: 'vendor-b-1', name: 'Vendor B1', booth: 'B04' },
            { id: 'vendor-z', name: 'Vendor Z', booth: 'Z09' }
        ];
        const context = {
            vendors,
            sessionVendors: vendors,
            npcGroup: {
                getChildren: () => [zoneASpriteOne, zoneASpriteTwo, zoneBSprite, zoneCSprite]
            },
            gameObjectFactory: {},
            vendorAssignmentDone: false,
            getNPCSprites: () => [zoneASpriteOne, zoneASpriteTwo, zoneBSprite, zoneCSprite]
        };

        VendorManager.prototype.assignVendorsToNPCs.call(context);

        expect(zoneASpriteOne.vendorData).toBe(vendors[0]);
        expect(zoneASpriteTwo.vendorData).toBe(vendors[1]);
        expect(zoneBSprite.vendorData).toBe(vendors[2]);
        expect(zoneCSprite.vendorData).toBeNull();
        expect([zoneASpriteOne.vendorData, zoneASpriteTwo.vendorData, zoneBSprite.vendorData, zoneCSprite.vendorData])
            .not.toContain(vendors[3]);
    });

    it('leaves represented zones underfilled when the session roster omits later matching vendors', () => {
        DomainManager.domains = [];

        const zoneBSprites = [
            { spawnZone: 'B' },
            { spawnZone: 'B' },
            { spawnZone: 'B' },
            { spawnZone: 'B' }
        ];
        const zoneASprite = { spawnZone: 'A' };
        const vendors = [
            { id: 'vendor-b-1', name: 'Vendor B1', booth: 'B01' },
            { id: 'vendor-a-1', name: 'Vendor A1', booth: 'A01' },
            { id: 'vendor-b-2', name: 'Vendor B2', booth: 'B02' },
            { id: 'vendor-b-3', name: 'Vendor B3', booth: 'B03' },
            { id: 'vendor-b-4', name: 'Vendor B4', booth: 'B04' }
        ];
        const sessionVendors = [vendors[0], vendors[1]];
        const context = {
            vendors,
            sessionVendors,
            npcGroup: {
                getChildren: () => [zoneBSprites[0], zoneBSprites[1], zoneBSprites[2], zoneBSprites[3], zoneASprite]
            },
            gameObjectFactory: {},
            vendorAssignmentDone: false,
            getNPCSprites: () => [zoneBSprites[0], zoneBSprites[1], zoneBSprites[2], zoneBSprites[3], zoneASprite],
            getAssignmentVendorPool: vi.fn()
        };

        VendorManager.prototype.assignVendorsToNPCs.call(context);

        expect(context.getAssignmentVendorPool).not.toHaveBeenCalled();
        expect(zoneBSprites.map(sprite => sprite.vendorData?.id ?? null)).toEqual([
            'vendor-b-1',
            null,
            null,
            null
        ]);
        expect(zoneASprite.vendorData).toBe(vendors[1]);
    });
});