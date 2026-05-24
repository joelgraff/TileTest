import { describe, expect, it } from 'vitest';

import { bindSceneBooleanFlag } from '../../stateBindings.js';

describe('scene state bindings', () => {
    it('keeps scene boolean flags and shared state in sync both ways', () => {
        const state = {
            interactionsEnabled: false
        };
        const scene = {};

        bindSceneBooleanFlag(scene, state, 'interactionsEnabled');

        expect(scene.interactionsEnabled).toBe(false);

        scene.interactionsEnabled = true;
        expect(state.interactionsEnabled).toBe(true);

        state.interactionsEnabled = false;
        expect(scene.interactionsEnabled).toBe(false);
    });
});