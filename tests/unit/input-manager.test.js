import { describe, expect, it } from 'vitest';

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
            suppressPointerUntilRelease: InputManager.prototype.suppressPointerUntilRelease,
            target: { x: 12, y: 34 },
            isDragging: true,
            direction: { x: 1, y: -1 },
            ignorePointerUntilRelease: false
        };

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