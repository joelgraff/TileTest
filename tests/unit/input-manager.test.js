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
            uiManager: {
                handlePointerMove
            }
        };

        InputManager.prototype.forwardPointerMove.call(context, { x: 14, y: 28 }, true);
        InputManager.prototype.forwardPointerMove.call(context, { x: 14, y: 28 }, false);

        expect(handlePointerMove).toHaveBeenNthCalledWith(1, 14, 28, true);
        expect(handlePointerMove).toHaveBeenNthCalledWith(2, 14, 28, false);
    });

    it('resets movement immediately when dialog state blocks input', () => {
        const context = {
            scene: {
                interactionsEnabled: true,
                isDialogOpen: true
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
            scene: {
                interactionsEnabled: false,
                isDialogOpen: false
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
});