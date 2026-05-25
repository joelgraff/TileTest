import { afterEach, describe, expect, it, vi } from 'vitest';

import PlayerManager from '../../playerManager.js';

describe('PlayerManager movement ownership', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        PlayerManager.lastX = 0;
        PlayerManager.lastY = 0;
        PlayerManager.stuckCounter = 0;
    });

    it('resolves movement direction once per frame and reuses it across player runtime handlers', () => {
        const direction = { x: 1, y: -1 };
        const scene = {
            player: {},
            inputManager: {
                getDirection: vi.fn(() => direction)
            },
            isDialogOpen: false
        };
        const movementSpy = vi.spyOn(PlayerManager, 'handlePlayerMovement').mockImplementation(() => {});
        const animationSpy = vi.spyOn(PlayerManager, 'handlePlayerAnimation').mockImplementation(() => {});
        const depthSpy = vi.spyOn(PlayerManager, 'updatePlayerDepth').mockImplementation(() => {});
        const debugSpy = vi.spyOn(PlayerManager, 'drawPlayerDebug').mockImplementation(() => {});

        PlayerManager.update(scene, 0, 16);

        expect(scene.inputManager.getDirection).toHaveBeenCalledTimes(1);
        expect(movementSpy).toHaveBeenCalledWith(scene, direction);
        expect(animationSpy).toHaveBeenCalledWith(scene, direction);
        expect(depthSpy).toHaveBeenCalledWith(scene);
        expect(debugSpy).toHaveBeenCalledWith(scene, direction);
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