import { describe, expect, it, vi } from 'vitest';

import { initializeInteractionReadiness } from '../../bootReadiness.js';

describe('boot readiness', () => {
    it('initializes quest readiness and updates the shared interaction gate', async () => {
        const scene = {
            vendors: [{ id: 'vendor-1' }],
            uiManager: { id: 'ui' },
            questManager: {
                init: vi.fn(async () => true)
            },
            interactionsEnabled: false
        };

        const isReady = await initializeInteractionReadiness({
            questManager: scene.questManager,
            vendors: scene.vendors,
            setInteractionsEnabled: (value) => {
                scene.interactionsEnabled = value;
            }
        });

        expect(scene.questManager.init).toHaveBeenCalledWith(scene.vendors, { discoveryTrails: [] });
        expect(scene.interactionsEnabled).toBe(true);
        expect(isReady).toBe(true);
    });

    it('prefers live discovery trails before initializing quests', async () => {
        const staticTrails = [{ id: 'static-trail' }];
        const liveTrails = [{ id: 'live-trail' }];
        const questManager = {
            init: vi.fn(async () => true)
        };
        let resolveLiveReady;
        const liveContentReadyPromise = new Promise(resolve => {
            resolveLiveReady = resolve;
        });
        const readinessPromise = initializeInteractionReadiness({
            questManager,
            vendors: [{ id: 'vendor-1' }],
            discoveryTrails: staticTrails,
            liveVendorContentService: {
                getDiscoveryTrails: vi.fn(() => liveTrails)
            },
            liveContentReadyPromise,
            setInteractionsEnabled: vi.fn()
        });

        expect(questManager.init).not.toHaveBeenCalled();

        resolveLiveReady(true);
        await expect(readinessPromise).resolves.toBe(true);

        expect(questManager.init).toHaveBeenCalledWith([{ id: 'vendor-1' }], { discoveryTrails: liveTrails });
    });

    it('keeps interactions disabled when quest readiness fails', async () => {
        const scene = {
            vendors: [{ id: 'vendor-1' }],
            uiManager: { id: 'ui' },
            questManager: {
                init: vi.fn(async () => false)
            },
            interactionsEnabled: true
        };

        const isReady = await initializeInteractionReadiness({
            questManager: scene.questManager,
            vendors: scene.vendors,
            setInteractionsEnabled: (value) => {
                scene.interactionsEnabled = value;
            }
        });

        expect(scene.interactionsEnabled).toBe(false);
        expect(isReady).toBe(false);
    });
});