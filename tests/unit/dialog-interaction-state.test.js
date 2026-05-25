import { describe, expect, it, vi } from 'vitest';

import DialogManager from '../../dialogManager.js';

describe('DialogManager interaction state', () => {
    it('clears movement through the injected InputManager when a dialog opens', () => {
        const prepareUiInteraction = vi.fn();
        const context = {
            isDialogOpen: false,
            scene: {
                isDialogOpen: false,
                cameras: {
                    main: {
                        width: 800,
                        height: 600
                    }
                }
            },
            prepareUiInteraction,
            inputManager: {
                prepareUiInteraction
            },
            createOverlay: vi.fn(() => ({ destroy: vi.fn() })),
            createContainer: vi.fn(() => ({ add: vi.fn(), setDepth: vi.fn() })),
            renderBackground: vi.fn(),
            renderTitleBar: vi.fn(),
            renderNpcImage: vi.fn(),
            renderDialogText: vi.fn(),
            renderButtons: vi.fn(),
            renderBottomButtons: vi.fn(),
            renderExitButton: vi.fn(),
            addElementsToContainer: vi.fn(),
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons),
            isMobile: false
        };

        DialogManager.prototype.showDialog.call(context, { text: 'Test dialog' });

        expect(prepareUiInteraction).toHaveBeenCalledTimes(1);
        expect(context.isDialogOpen).toBe(true);
        expect(context.scene.isDialogOpen).toBe(true);
        expect(context.dialogLayout.buttonFactory.prepareUiInteraction).toBe(prepareUiInteraction);
    });

    it('suppresses pointer movement through InputManager when a dialog closes mid-click', () => {
        const prepareUiInteraction = vi.fn();
        const dialogLayout = { clear: vi.fn() };
        const dialogContainer = { destroy: vi.fn() };
        const overlay = { destroy: vi.fn() };
        const context = {
            isDialogOpen: true,
            scene: {
                isDialogOpen: true,
            },
            prepareUiInteraction,
            isPointerDown: () => true,
            inputManager: {
                prepareUiInteraction
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

    it('releases pointer suppression when a dialog closes after the pointer is already up', () => {
        const prepareUiInteraction = vi.fn();
        const releasePointerSuppression = vi.fn();
        const dialogLayout = { clear: vi.fn() };
        const dialogContainer = { destroy: vi.fn() };
        const overlay = { destroy: vi.fn() };
        const context = {
            isDialogOpen: true,
            scene: {
                isDialogOpen: true
            },
            prepareUiInteraction,
            releasePointerSuppression,
            isPointerDown: () => false,
            inputManager: {
                prepareUiInteraction,
                releasePointerSuppression
            },
            dialogLayout,
            dialogContainer,
            overlay
        };

        DialogManager.prototype.hideDialog.call(context);

        expect(prepareUiInteraction).not.toHaveBeenCalled();
        expect(releasePointerSuppression).toHaveBeenCalledTimes(1);
    });
});