import { afterEach, describe, expect, it, vi } from 'vitest';

import InteractionCoordinator from '../../interactionCoordinator.js';

describe('InteractionCoordinator', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
    });

    it('binds keyboard and pointer vendor handlers on construction', () => {
        const keyboardOn = vi.fn();
        const inputOn = vi.fn();

        new InteractionCoordinator({
            input: {
                keyboard: { on: keyboardOn },
                on: inputOn
            }
        });

        expect(keyboardOn).toHaveBeenCalledWith('keydown-SPACE', expect.any(Function));
        expect(inputOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('opens a nearby vendor for keyboard interaction when available', () => {
        const nearbyVendor = {
            vendorData: { id: 'vendor-1' },
            getBounds: () => ({})
        };
        const interactWithVendorSprite = vi.fn(() => true);
        const coordinator = new InteractionCoordinator({
            input: {
                keyboard: { on: vi.fn() },
                on: vi.fn()
            }
        }, {
            vendorManager: {
                nearbyVendor,
                isInteractionAvailable: () => true,
                interactWithVendorSprite
            }
        });

        const interacted = coordinator.interactWithNearbyVendor();

        expect(interacted).toBe(true);
        expect(interactWithVendorSprite).toHaveBeenCalledWith(nearbyVendor);
    });

    it('suppresses pointer movement before opening a clicked nearby vendor', () => {
        globalThis.Phaser = {
            Geom: {
                Rectangle: {
                    Contains: vi.fn(() => true)
                }
            }
        };

        const suppressPointerUntilRelease = vi.fn();
        const nearbyVendor = {
            vendorData: { id: 'vendor-1' },
            getBounds: () => ({ x: 0, y: 0, width: 32, height: 32 })
        };
        const interactWithVendorSprite = vi.fn(() => true);
        const coordinator = new InteractionCoordinator({
            input: {
                keyboard: { on: vi.fn() },
                on: vi.fn()
            }
        }, {
            vendorManager: {
                nearbyVendor,
                isInteractionAvailable: () => true,
                interactWithVendorSprite
            },
            inputManager: {
                suppressPointerUntilRelease
            }
        });

        const interacted = coordinator.interactWithNearbyVendor({ worldX: 10, worldY: 12 });

        expect(interacted).toBe(true);
        expect(suppressPointerUntilRelease).toHaveBeenCalledTimes(1);
        expect(interactWithVendorSprite).toHaveBeenCalledWith(nearbyVendor);
    });
});