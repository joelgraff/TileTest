import { describe, expect, it, vi } from 'vitest';

import {
    hideMovementIndicatorReticle,
    initializeMovementIndicator,
    showMovementIndicatorReticle,
    updateMovementIndicatorFromPointer
} from '../../uiMovementIndicator.js';

describe('UI movement indicator', () => {
    it('initializes the reticle graphic with the expected default state', () => {
        const graphics = {
            setDepth: vi.fn(function () { return this; }),
            setVisible: vi.fn(function () { return this; }),
            alpha: 0
        };
        const uiManager = {
            scene: {
                add: {
                    graphics: vi.fn(() => graphics)
                }
            }
        };

        const result = initializeMovementIndicator(uiManager);

        expect(result).toBe(graphics);
        expect(uiManager.scene.add.graphics).toHaveBeenCalledTimes(1);
        expect(graphics.setDepth).toHaveBeenCalledWith(999);
        expect(graphics.setVisible).toHaveBeenCalledWith(false);
        expect(graphics.alpha).toBe(1);
        expect(uiManager.movementIndicator).toBe(graphics);
        expect(uiManager.movementIndicatorFadeTween).toBe(null);
    });

    it('renders and hides the reticle through scene helpers', () => {
        const stop = vi.fn();
        const existingFadeTween = { stop };
        const graphics = {
            clear: vi.fn(),
            lineStyle: vi.fn(function () { return this; }),
            strokeCircle: vi.fn(function () { return this; }),
            beginPath: vi.fn(function () { return this; }),
            moveTo: vi.fn(function () { return this; }),
            lineTo: vi.fn(function () { return this; }),
            strokePath: vi.fn(function () { return this; }),
            setVisible: vi.fn(function () { return this; }),
            alpha: 0
        };
        const tween = { id: 'fade' };
        const uiManager = {
            movementIndicator: graphics,
            movementIndicatorFadeTween: existingFadeTween,
            scene: {
                tweens: {
                    add: vi.fn((config) => {
                        config.onComplete();
                        return tween;
                    })
                }
            }
        };

        showMovementIndicatorReticle(uiManager, 100, 120);

        expect(graphics.clear).toHaveBeenCalledTimes(1);
        expect(graphics.strokeCircle).toHaveBeenCalledWith(100, 120, 16);
        expect(graphics.moveTo).toHaveBeenCalledWith(88, 120);
        expect(graphics.lineTo).toHaveBeenCalledWith(112, 120);
        expect(graphics.setVisible).toHaveBeenCalledWith(true);
        expect(graphics.alpha).toBe(1);
        expect(stop).toHaveBeenCalledTimes(1);
        expect(uiManager.movementIndicatorFadeTween).toBe(null);

        const result = hideMovementIndicatorReticle(uiManager);

        expect(result).toBe(tween);
        expect(uiManager.scene.tweens.add).toHaveBeenCalledWith({
            targets: graphics,
            alpha: 0,
            duration: 200,
            onComplete: expect.any(Function)
        });
        expect(graphics.setVisible).toHaveBeenLastCalledWith(false);
        expect(uiManager.movementIndicatorFadeTween).toBe(tween);
    });

    it('projects pointer coordinates through the main camera before updating the reticle', () => {
        const uiManager = {
            movementIndicator: {
                clear: vi.fn(),
                lineStyle: vi.fn(function () { return this; }),
                strokeCircle: vi.fn(function () { return this; }),
                beginPath: vi.fn(function () { return this; }),
                moveTo: vi.fn(function () { return this; }),
                lineTo: vi.fn(function () { return this; }),
                strokePath: vi.fn(function () { return this; }),
                setVisible: vi.fn(function () { return this; }),
                alpha: 0
            },
            movementIndicatorFadeTween: null,
            scene: {
                cameras: {
                    main: {
                        getWorldPoint: vi.fn(() => ({ x: 42, y: 84 }))
                    }
                },
                tweens: {
                    add: vi.fn(() => ({ id: 'fade' }))
                }
            }
        };

        const worldPoint = updateMovementIndicatorFromPointer(uiManager, 12, 24, true);

        expect(uiManager.scene.cameras.main.getWorldPoint).toHaveBeenCalledWith(12, 24);
        expect(worldPoint).toEqual({ x: 42, y: 84 });
        expect(uiManager.movementIndicator.strokeCircle).toHaveBeenCalledWith(42, 84, 16);

        const hidden = updateMovementIndicatorFromPointer(uiManager, 12, 24, false);

        expect(hidden).toBe(null);
        expect(uiManager.scene.tweens.add).toHaveBeenCalledTimes(1);
    });
});