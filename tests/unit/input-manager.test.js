import { describe, expect, it, vi } from 'vitest';

import InputManager from '../../input_Manager.js';

describe('InputManager movement reset', () => {
    it('clears target, drag state, and direction through one shared method', () => {
        const context = {
            target: { x: 12, y: 34 },
            isDragging: true,
            direction: { x: 1, y: -1 }
        };

        InputManager.prototype.clearMovementState.call(context);

        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });
    });

    it('routes UI interaction resets through one method', () => {
        const context = {
            clearMovementState: InputManager.prototype.clearMovementState,
            forwardPointerMove: InputManager.prototype.forwardPointerMove,
            hasMovementTarget: InputManager.prototype.hasMovementTarget,
            cancelMovementTarget: InputManager.prototype.cancelMovementTarget,
            suppressPointerUntilRelease: InputManager.prototype.suppressPointerUntilRelease,
            target: { x: 12, y: 34 },
            isDragging: true,
            direction: { x: 1, y: -1 },
            ignorePointerUntilRelease: false
        };

        expect(context.hasMovementTarget()).toBe(true);

        context.cancelMovementTarget();

        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });

        InputManager.prototype.prepareUiInteraction.call(context);

        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });
        expect(context.ignorePointerUntilRelease).toBe(false);

        context.target = { x: 3, y: 4 };
        context.isDragging = true;
        context.direction = { x: -1, y: 1 };

        InputManager.prototype.prepareUiInteraction.call(context, { suppressPointer: true });

        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });
        expect(context.ignorePointerUntilRelease).toBe(true);
        expect(context.hasMovementTarget()).toBe(false);
    });

    it('forwards pointer move state through the injected UI collaborator', () => {
        const handlePointerMove = vi.fn();
        const context = {
            handlePointerMove
        };

        InputManager.prototype.forwardPointerMove.call(context, { x: 14, y: 28 }, true);
        InputManager.prototype.forwardPointerMove.call(context, { x: 14, y: 28 }, false);

        expect(handlePointerMove).toHaveBeenNthCalledWith(1, 14, 28, true);
        expect(handlePointerMove).toHaveBeenNthCalledWith(2, 14, 28, false);
    });

    it('resets movement immediately when dialog state blocks input', () => {
        const context = {
            state: {
                interactionsEnabled: true,
                isDialogOpen: true
            },
            scene: {
                player: { x: 0, y: 0 }
            },
            target: { x: 5, y: 9 },
            isDragging: true,
            direction: { x: 1, y: 1 },
            clearMovementState: InputManager.prototype.clearMovementState
        };

        const direction = InputManager.prototype.getDirection.call(context);

        expect(direction).toEqual({ x: 0, y: 0 });
        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });
    });

    it('returns no movement while interactions are disabled', () => {
        const context = {
            state: {
                interactionsEnabled: false,
                isDialogOpen: false
            },
            scene: {
                player: { x: 0, y: 0 }
            },
            target: { x: 5, y: 9 },
            isDragging: true,
            direction: { x: 1, y: 1 },
            clearMovementState: InputManager.prototype.clearMovementState
        };

        const direction = InputManager.prototype.getDirection.call(context);

        expect(direction).toEqual({ x: 0, y: 0 });
        expect(context.target).toBe(null);
        expect(context.isDragging).toBe(false);
        expect(context.direction).toEqual({ x: 0, y: 0 });
    });

    it('prefers keyboard direction over pointer target and drag state', () => {
        const context = {
            state: {
                interactionsEnabled: true,
                isDialogOpen: false
            },
            scene: {
                player: { x: 100, y: 100 }
            },
            cursors: {
                left: { isDown: false },
                right: { isDown: true },
                up: { isDown: true },
                down: { isDown: false }
            },
            target: { x: 200, y: 200 },
            isDragging: true,
            direction: { x: -1, y: 0 },
            ignorePointerUntilRelease: false,
            clearMovementState: InputManager.prototype.clearMovementState
        };

        const direction = InputManager.prototype.getDirection.call(context);

        expect(direction).toEqual({ x: 1, y: -1 });
        expect(context.target).toEqual({ x: 200, y: 200 });
    });

    it('clears a nearby movement target once the player reaches it', () => {
        const context = {
            state: {
                interactionsEnabled: true,
                isDialogOpen: false
            },
            scene: {
                player: { x: 100, y: 100 }
            },
            cursors: {
                left: { isDown: false },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            },
            target: { x: 110, y: 110 },
            isDragging: false,
            direction: { x: 0, y: 0 },
            ignorePointerUntilRelease: false,
            clearMovementState: InputManager.prototype.clearMovementState
        };

        const direction = InputManager.prototype.getDirection.call(context);

        expect(direction).toEqual({ x: 0, y: 0 });
        expect(context.target).toBe(null);
    });

    it('falls back to drag direction when no keyboard or tap target is active', () => {
        const context = {
            state: {
                interactionsEnabled: true,
                isDialogOpen: false
            },
            scene: {
                player: { x: 100, y: 100 }
            },
            cursors: {
                left: { isDown: false },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            },
            target: null,
            isDragging: true,
            direction: { x: 0.6, y: 0.8 },
            ignorePointerUntilRelease: false,
            clearMovementState: InputManager.prototype.clearMovementState
        };

        const direction = InputManager.prototype.getDirection.call(context);

        expect(direction).toEqual({ x: 0.6, y: 0.8 });
    });

    it('normalizes drag direction relative to the player position', () => {
        const context = {
            scene: {
                player: { x: 10, y: 20 }
            },
            threshold: 20,
            direction: { x: 0, y: 0 }
        };

        const direction = InputManager.prototype.updateDirection.call(context, { x: 40, y: 60 });

        expect(direction.x).toBeCloseTo(0.6, 5);
        expect(direction.y).toBeCloseTo(0.8, 5);
        expect(context.direction).toEqual(direction);

        const zeroDirection = InputManager.prototype.updateDirection.call(context, { x: 20, y: 30 });

        expect(zeroDirection).toEqual({ x: 0, y: 0 });
        expect(context.direction).toEqual({ x: 0, y: 0 });
    });
});