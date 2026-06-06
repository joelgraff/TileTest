import { afterEach, describe, expect, it, vi } from 'vitest';

import DomainManager from '../../domainManager.js';
import VendorManager from '../../vendorManager.js';

describe('VendorManager collaborators', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
        DomainManager.domains = null;
    });

    it('updates nearby vendor prompt state through injected player, npc group, and camera collaborators', () => {
        DomainManager.domains = [];
        globalThis.Phaser = {
            Math: {
                Distance: {
                    Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
                }
            }
        };

        const farGlow = { setVisible: vi.fn() };
        const nearGlow = {
            setVisible: vi.fn(),
            clear: vi.fn(),
            fillStyle: vi.fn(function () { return this; }),
            fillCircle: vi.fn(function () { return this; })
        };
        const farVendor = {
            x: 220,
            y: 240,
            vendorData: { id: 'vendor-2' },
            glowGraphic: farGlow,
            displayWidth: 32
        };
        const nearVendor = {
            x: 120,
            y: 130,
            vendorData: { id: 'vendor-1' },
            glowGraphic: nearGlow,
            glowPulse: 0,
            displayWidth: 32
        };
        const interactionPrompt = {
            x: 0,
            y: 0,
            setVisible: vi.fn(function () { return this; })
        };
        const context = {
            assignVendorsToNPCs: vi.fn(),
            getNPCSprites: () => [farVendor, nearVendor],
            interactionRange: 80,
            nearbyVendor: null,
            interactionPrompt,
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
        expect(farGlow.setVisible).toHaveBeenCalledWith(false);
        expect(nearGlow.setVisible).toHaveBeenCalledWith(true);
        expect(interactionPrompt.x).toBe(110);
        expect(interactionPrompt.y).toBe(75);
        expect(interactionPrompt.setVisible).toHaveBeenLastCalledWith(true);
    });

    it('skips sleeping vendors when the active NPC list excludes them', () => {
        DomainManager.domains = [];
        globalThis.Phaser = {
            Math: {
                Distance: {
                    Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
                }
            }
        };

        const sleepingGlow = { setVisible: vi.fn() };
        const activeGlow = {
            setVisible: vi.fn(),
            clear: vi.fn(),
            fillStyle: vi.fn(function () { return this; }),
            fillCircle: vi.fn(function () { return this; })
        };
        const sleepingVendor = {
            x: 110,
            y: 110,
            body: { enable: false },
            vendorData: { id: 'vendor-sleeping' },
            glowGraphic: sleepingGlow,
            displayWidth: 32
        };
        const activeVendor = {
            x: 180,
            y: 180,
            body: { enable: true },
            vendorData: { id: 'vendor-active' },
            glowGraphic: activeGlow,
            displayWidth: 32
        };
        const interactionPrompt = {
            x: 0,
            y: 0,
            setVisible: vi.fn(function () { return this; })
        };
        const context = {
            assignVendorsToNPCs: vi.fn(),
            getNPCSprites: () => [sleepingVendor, activeVendor],
            interactionRange: 120,
            nearbyVendor: null,
            interactionPrompt,
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
        expect(sleepingGlow.setVisible).not.toHaveBeenCalled();
        expect(activeGlow.setVisible).toHaveBeenCalledWith(true);
    });
});