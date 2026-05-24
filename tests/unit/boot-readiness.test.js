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

        const isReady = await initializeInteractionReadiness(scene);

        expect(scene.questManager.init).toHaveBeenCalledWith(scene.vendors, scene.uiManager, scene);
        expect(scene.interactionsEnabled).toBe(true);
        expect(isReady).toBe(true);
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

        const isReady = await initializeInteractionReadiness(scene);

        expect(scene.interactionsEnabled).toBe(false);
        expect(isReady).toBe(false);
    });
});