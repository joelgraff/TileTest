import { afterEach, describe, expect, it, vi } from 'vitest';

import InteractionCoordinator from '../../interactionCoordinator.js';

describe('InteractionCoordinator', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
    });

    it('binds generic keyboard and pointer handlers on construction', () => {
        const keyboardOn = vi.fn();
        const inputOn = vi.fn();

        new InteractionCoordinator({
            input: {
                keyboard: { on: keyboardOn },
                on: inputOn
            }
        });

        expect(keyboardOn).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(inputOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('routes UI and debug keyboard shortcuts through the injected collaborators', () => {
        const handleInput = vi.fn();
        const debugToggleHandler = vi.fn();
        const preventDefault = vi.fn();
        const coordinator = new InteractionCoordinator({
            input: {
                keyboard: { on: vi.fn() },
                on: vi.fn()
            }
        }, {
            uiManager: {
                handleInput
            }
        });

        coordinator.setDebugToggleHandler(debugToggleHandler);

        expect(coordinator.handleKeyDown({ code: 'KeyI', preventDefault })).toBe(true);
        expect(coordinator.handleKeyDown({ code: 'KeyQ', preventDefault })).toBe(true);
        expect(coordinator.handleKeyDown({ code: 'Escape', preventDefault })).toBe(true);
        expect(coordinator.handleKeyDown({ code: 'Backquote', preventDefault })).toBe(true);

        expect(handleInput).toHaveBeenNthCalledWith(1, 'I');
        expect(handleInput).toHaveBeenNthCalledWith(2, 'Q');
        expect(handleInput).toHaveBeenNthCalledWith(3, 'ESCAPE');
        expect(debugToggleHandler).toHaveBeenCalledTimes(1);
        expect(preventDefault).toHaveBeenCalledTimes(4);
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

        const interacted = coordinator.handleKeyDown({ code: 'Space', preventDefault: vi.fn() });

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