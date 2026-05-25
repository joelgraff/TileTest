import { describe, expect, it, vi } from 'vitest';

import InputManager from '../../input_Manager.js';

function createScene() {
    const handlers = {};

    return {
        handlers,
        scene: {
            gameState: {
                interactionsEnabled: true,
                isDialogOpen: false
            },
            player: { x: 0, y: 0 },
            cameras: {
                main: {
                    getWorldPoint: vi.fn((x, y) => ({ x: x + 100, y: y + 200 }))
                }
            },
            input: {
                keyboard: {
                    createCursorKeys: vi.fn(() => ({
                        left: { isDown: false },
                        right: { isDown: false },
                        up: { isDown: false },
                        down: { isDown: false }
                    }))
                },
                on: vi.fn((eventName, handler) => {
                    handlers[eventName] = handler;
                })
            }
        }
    };
}

describe('InputManager pointer handlers', () => {
    it('registers pointer handlers and captures tap-to-move targets on pointerdown', () => {
        const { scene, handlers } = createScene();
        const uiManager = { handlePointerMove: vi.fn() };

        const manager = new InputManager(scene, { uiManager, state: scene.gameState });

        expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        expect(scene.input.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(scene.input.on).toHaveBeenCalledWith('pointerup', expect.any(Function));

        handlers.pointerdown({ x: 10, y: 20 });

        expect(manager.touchStart).toEqual({ x: 10, y: 20 });
        expect(manager.touchEnd).toEqual({ x: 10, y: 20 });
        expect(manager.target).toEqual({ x: 110, y: 220 });
        expect(manager.isDragging).toBe(false);
        expect(scene.cameras.main.getWorldPoint).toHaveBeenCalledWith(10, 20);
        expect(uiManager.handlePointerMove).toHaveBeenCalledWith(10, 20, true);
    });

    it('does not start click-to-move when the interaction coordinator consumes pointerdown', () => {
        const { scene, handlers } = createScene();
        const uiManager = { handlePointerMove: vi.fn() };
        const interactionCoordinator = {
            handlePointerDown: vi.fn(() => true)
        };

        const manager = new InputManager(scene, { uiManager, state: scene.gameState });
        manager.setInteractionCoordinator(interactionCoordinator);

        handlers.pointerdown({ x: 10, y: 20 });

        expect(interactionCoordinator.handlePointerDown).toHaveBeenCalledWith({ x: 10, y: 20 });
        expect(manager.target).toBe(null);
        expect(scene.cameras.main.getWorldPoint).not.toHaveBeenCalled();
        expect(uiManager.handlePointerMove).not.toHaveBeenCalled();
    });

    it('promotes drag input after the movement threshold and updates the projected target once', () => {
        const { scene, handlers } = createScene();
        const uiManager = { handlePointerMove: vi.fn() };

        const manager = new InputManager(scene, { uiManager, state: scene.gameState });

        handlers.pointerdown({ x: 0, y: 0 });
        scene.cameras.main.getWorldPoint.mockClear();
        uiManager.handlePointerMove.mockClear();

        handlers.pointermove({ x: 30, y: 0, isDown: true });

        expect(manager.isDragging).toBe(true);
        expect(manager.target).toEqual({ x: 130, y: 200 });
        expect(scene.cameras.main.getWorldPoint).toHaveBeenCalledTimes(1);
        expect(scene.cameras.main.getWorldPoint).toHaveBeenCalledWith(30, 0);
        expect(uiManager.handlePointerMove).toHaveBeenCalledWith(30, 0, true);
    });

    it('keeps ignored pointer suppression latched while dialog input is still open', () => {
        const { scene, handlers } = createScene();
        const uiManager = { handlePointerMove: vi.fn() };

        const manager = new InputManager(scene, { uiManager, state: scene.gameState });
        manager.ignorePointerUntilRelease = true;
        scene.gameState.isDialogOpen = true;

        handlers.pointerup({ x: 5, y: 9 });

        expect(manager.ignorePointerUntilRelease).toBe(true);
        expect(uiManager.handlePointerMove).not.toHaveBeenCalled();
    });
});