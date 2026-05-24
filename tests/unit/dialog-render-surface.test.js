import { describe, expect, it, vi } from 'vitest';

import { renderDialogSurface } from '../../dialogRenderSurface.js';

describe('dialog render surface', () => {
    it('constructs dialog layout state and delegates the render sequence through manager methods', () => {
        const scene = {
            cameras: {
                main: {
                    width: 800,
                    height: 600
                }
            }
        };
        const DialogLayoutClass = vi.fn(function (sceneArg, x, y, width, height, options) {
            this.sceneArg = sceneArg;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.options = options;
        });
        const manager = {
            scene,
            isMobile: false,
            inputManager: { id: 'input-1' },
            createOverlay: vi.fn(() => ({ id: 'overlay-1' })),
            createContainer: vi.fn(() => ({ id: 'container-1' })),
            renderBackground: vi.fn(),
            renderTitleBar: vi.fn(),
            renderNpcImage: vi.fn(),
            renderDialogText: vi.fn(),
            renderButtons: vi.fn(),
            renderBottomButtons: vi.fn(),
            renderExitButton: vi.fn(),
            addElementsToContainer: vi.fn(),
            handleTextPagination: vi.fn(() => 'paged text'),
            handleButtonPagination: vi.fn(() => ['paged button']),
            handleBottomButtonPagination: vi.fn(() => ['bottom button'])
        };
        const params = {
            imageKey: 'npc-1',
            title: 'Vendor',
            text: ['Fact 1', 'Fact 2'],
            buttons: ['a'],
            exitButton: { label: 'Close' },
            pagination: { currentPage: 0 },
            bottomButtons: ['b'],
            textPagination: { currentPage: 1 }
        };

        renderDialogSurface(manager, params, { DialogLayoutClass });

        expect(manager.currentDialogParams).toEqual(params);
        expect(DialogLayoutClass).toHaveBeenCalledWith(
            scene,
            400,
            414,
            600,
            340,
            { inputManager: manager.inputManager }
        );
        expect(manager.dialogLayout).toBe(DialogLayoutClass.mock.instances[0]);
        expect(manager.createOverlay).toHaveBeenCalledWith(scene.cameras.main);
        expect(manager.createContainer).toHaveBeenCalledWith(scene.cameras.main, 600, 340);
        expect(manager.overlay).toEqual({ id: 'overlay-1' });
        expect(manager.dialogContainer).toEqual({ id: 'container-1' });
        expect(manager.handleTextPagination).toHaveBeenCalledWith(params.text, params.textPagination);
        expect(manager.handleButtonPagination).toHaveBeenCalledWith(params.buttons, params.pagination, params.textPagination);
        expect(manager.handleBottomButtonPagination).toHaveBeenCalledWith(params.bottomButtons, params.textPagination);
        expect(manager.renderBackground).toHaveBeenCalledWith(600, 340);
        expect(manager.renderTitleBar).toHaveBeenCalledWith('Vendor', 600, 340);
        expect(manager.renderNpcImage).toHaveBeenCalledWith('npc-1', 600, 340);
        expect(manager.renderDialogText).toHaveBeenCalledWith('paged text', 600, 340);
        expect(manager.renderButtons).toHaveBeenCalledWith(['paged button']);
        expect(manager.renderBottomButtons).toHaveBeenCalledWith(['bottom button']);
        expect(manager.renderExitButton).toHaveBeenCalledWith(params.exitButton);
        expect(manager.addElementsToContainer).toHaveBeenCalledTimes(1);
    });
});