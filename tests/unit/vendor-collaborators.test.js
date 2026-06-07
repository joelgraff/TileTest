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
});