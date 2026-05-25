import { describe, expect, it, vi } from 'vitest';

import { initializeSceneRuntime } from '../../sceneRuntimeSetup.js';

describe('scene runtime setup', () => {
    it('configures camera state and re-runs collision setup when debug is toggled', () => {
        const startFollow = vi.fn();
        const centerOn = vi.fn();
        const setBounds = vi.fn();
        const setZoom = vi.fn();
        const destroyGraphics = vi.fn();
        const preserveSprite = vi.fn();
        const setDebugToggleHandler = vi.fn();
        const recreateCollision = vi.fn();
        const scene = {
            player: { x: 10, y: 20 },
            map: { widthInPixels: 640, heightInPixels: 480 },
            cameras: {
                main: {
                    startFollow,
                    centerOn,
                    setBounds,
                    setZoom
                }
            },
            input: {
                keyboard: {
                    on: vi.fn()
                }
            },
            children: {
                each: (callback) => {
                    callback({ type: 'Graphics', destroy: destroyGraphics });
                    callback({ type: 'Sprite', destroy: preserveSprite });
                }
            },
            debugEnabled: false
        };

        initializeSceneRuntime(scene, {
            isMobile: true,
            recreateCollision,
            interactionCoordinator: {
                setDebugToggleHandler
            }
        });

        expect(recreateCollision).toHaveBeenCalledTimes(1);
        expect(recreateCollision).toHaveBeenCalledWith(scene);
        expect(startFollow).toHaveBeenCalledWith(scene.player);
        expect(centerOn).toHaveBeenCalledWith(10, 20);
        expect(setBounds).toHaveBeenCalledWith(0, 0, 640, 480);
        expect(setZoom).toHaveBeenCalledWith(1.5);
        expect(setDebugToggleHandler).toHaveBeenCalledWith(expect.any(Function));

        const debugHandler = setDebugToggleHandler.mock.calls[0][0];
        debugHandler();

        expect(scene.debugEnabled).toBe(true);
        expect(destroyGraphics).toHaveBeenCalledTimes(1);
        expect(preserveSprite).not.toHaveBeenCalled();
        expect(recreateCollision).toHaveBeenCalledTimes(2);
        expect(recreateCollision).toHaveBeenLastCalledWith(scene);
    });
});