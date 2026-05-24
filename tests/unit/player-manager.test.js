import { afterEach, describe, expect, it, vi } from 'vitest';

import PlayerManager from '../../playerManager.js';

describe('PlayerManager movement ownership', () => {
    afterEach(() => {
        PlayerManager.lastX = 0;
        PlayerManager.lastY = 0;
        PlayerManager.stuckCounter = 0;
    });

    it('cancels a stuck movement target through InputManager ownership', () => {
        const setVelocity = vi.fn();
        const cancelMovementTarget = vi.fn();
        const scene = {
            player: {
                x: 100,
                y: 120,
                setVelocity
            },
            inputManager: {
                getDirection: () => ({ x: 0, y: 0 }),
                hasMovementTarget: () => true,
                cancelMovementTarget
            }
        };

        PlayerManager.lastX = 100;
        PlayerManager.lastY = 120;
        PlayerManager.stuckCounter = 1;

        PlayerManager.handlePlayerMovement(scene);

        expect(cancelMovementTarget).toHaveBeenCalledTimes(1);
        expect(setVelocity).toHaveBeenCalledWith(0, 0);
        expect(PlayerManager.stuckCounter).toBe(0);
    });
});