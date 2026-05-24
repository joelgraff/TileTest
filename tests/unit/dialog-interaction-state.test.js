import { describe, expect, it, vi } from 'vitest';

import DialogManager from '../../dialogManager.js';

describe('DialogManager interaction state', () => {
    it('suppresses pointer movement through InputManager when a dialog closes mid-click', () => {
        const prepareUiInteraction = vi.fn();
        const dialogLayout = { clear: vi.fn() };
        const dialogContainer = { destroy: vi.fn() };
        const overlay = { destroy: vi.fn() };
        const context = {
            isDialogOpen: true,
            scene: {
                isDialogOpen: true,
                input: {
                    activePointer: {
                        isDown: true
                    }
                },
                inputManager: {
                    prepareUiInteraction
                }
            },
            dialogLayout,
            dialogContainer,
            overlay
        };

        DialogManager.prototype.hideDialog.call(context);

        expect(context.isDialogOpen).toBe(false);
        expect(context.scene.isDialogOpen).toBe(false);
        expect(prepareUiInteraction).toHaveBeenCalledWith({ suppressPointer: true });
        expect(dialogLayout.clear).toHaveBeenCalledTimes(1);
        expect(dialogContainer.destroy).toHaveBeenCalledTimes(1);
        expect(overlay.destroy).toHaveBeenCalledTimes(1);
        expect(context.dialogLayout).toBe(null);
        expect(context.dialogContainer).toBe(null);
        expect(context.overlay).toBe(null);
    });
});