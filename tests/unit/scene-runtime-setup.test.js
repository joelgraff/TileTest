import { describe, expect, it, vi } from 'vitest';

import { initializeSceneRuntime } from '../../sceneRuntimeSetup.js';

function createFakeDocument() {
    class FakeElement {
        constructor(tagName, ownerDocument) {
            this.tagName = tagName;
            this.ownerDocument = ownerDocument;
            this.children = [];
            this.dataset = {};
            this.attributes = {};
            this.listeners = new Map();
            this.parentNode = null;
            this.className = '';
            this.textContent = '';
            this.hidden = false;
            this.style = {};
        }

        append(...children) {
            children.filter(Boolean).forEach(child => {
                child.parentNode = this;
                this.children.push(child);
            });

            return this;
        }

        remove() {
            if (!this.parentNode) {
                return;
            }

            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
            this.parentNode = null;
        }
    }

    const elementsById = new Map();
    const documentRef = {
        createElement: (tagName) => new FakeElement(tagName, documentRef),
        getElementById: (id) => elementsById.get(id) ?? null
    };
    const overlayRoot = new FakeElement('div', documentRef);

    elementsById.set('ui-overlay-root', overlayRoot);

    return {
        documentRef,
        overlayRoot
    };
}

describe('scene runtime setup', () => {
    it('configures camera state and toggles the DOM FPS overlay', () => {
        const startFollow = vi.fn();
        const centerOn = vi.fn();
        const setBounds = vi.fn();
        const setZoom = vi.fn();
        const setPhysicsBounds = vi.fn();
        const setFpsToggleHandler = vi.fn();
        const recreateCollision = vi.fn();
        let postUpdateHandler = null;
        let shutdownHandler = null;
        const { documentRef, overlayRoot } = createFakeDocument();
        const scene = {
            player: { x: 10, y: 20 },
            map: { widthInPixels: 640, heightInPixels: 480 },
            game: {
                loop: {
                    actualFps: 59.7
                }
            },
            cameras: {
                main: {
                    startFollow,
                    centerOn,
                    setBounds,
                    setZoom
                }
            },
            physics: {
                world: {
                    setBounds: setPhysicsBounds
                }
            },
            input: {
                keyboard: {
                    on: vi.fn()
                }
            },
            events: {
                on: vi.fn((eventName, callback) => {
                    if (eventName === 'postupdate') {
                        postUpdateHandler = callback;
                    }
                }),
                once: vi.fn((eventName, callback) => {
                    if (eventName === 'shutdown') {
                        shutdownHandler = callback;
                    }
                })
            }
        };

        initializeSceneRuntime(scene, {
            isMobile: true,
            recreateCollision,
            documentRef,
            interactionCoordinator: {
                setFpsToggleHandler
            }
        });

        expect(recreateCollision).toHaveBeenCalledTimes(1);
        expect(recreateCollision).toHaveBeenCalledWith(scene);
        expect(overlayRoot.children).toHaveLength(1);
        expect(scene.fpsDisplayText.tagName).toBe('div');
        expect(scene.fpsDisplayText.className).toBe('dom-fps-display');
        expect(scene.fpsDisplayText.dataset.fpsOverlay).toBe('true');
        expect(scene.fpsDisplayText.hidden).toBe(true);
        expect(scene.fpsDisplayText.textContent).toBe('FPS: --');
        expect(scene.events.on).toHaveBeenCalledWith('postupdate', expect.any(Function));
        expect(scene.events.once).toHaveBeenCalledWith('shutdown', expect.any(Function));
        expect(setPhysicsBounds).toHaveBeenCalledWith(0, 0, 640, 480);
        expect(startFollow).toHaveBeenCalledWith(scene.player);
        expect(centerOn).toHaveBeenCalledWith(10, 20);
        expect(setBounds).toHaveBeenCalledWith(0, 0, 640, 480);
        expect(setZoom).toHaveBeenCalledWith(1.5);
        expect(setFpsToggleHandler).toHaveBeenCalledWith(expect.any(Function));
        expect(scene.input.keyboard.on).not.toHaveBeenCalled();

        const fpsHandler = setFpsToggleHandler.mock.calls[0][0];

        fpsHandler();

        expect(scene.fpsDisplayVisible).toBe(true);
        expect(scene.fpsDisplayText.hidden).toBe(false);
        expect(scene.fpsDisplayText.textContent).toBe('FPS: 59.7');

        scene.game.loop.actualFps = 61.2;
        postUpdateHandler();
        expect(scene.fpsDisplayText.textContent).toBe('FPS: 61.2');

        shutdownHandler();
        expect(scene.fpsDisplayText).toBe(null);
        expect(overlayRoot.children).toHaveLength(0);
    });
});