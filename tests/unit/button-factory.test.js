import { describe, expect, it, vi } from 'vitest';

import ButtonFactory from '../../ui/ButtonFactory.js';

describe('ButtonFactory', () => {
    it('uses the injected interaction-prep callback for button clicks instead of scene-global input', () => {
        const handlers = {};
        const stopPropagation = vi.fn();
        const sceneInputPrepare = vi.fn();
        const injectedPrepare = vi.fn();
        const onClick = vi.fn();
        const btnText = {
            width: 48,
            setPosition() {
                return this;
            },
            setOrigin() {
                return this;
            },
            setDepth() {
                return this;
            }
        };
        const btnBg = {
            setOrigin() {
                return this;
            },
            setDepth() {
                return this;
            },
            setInteractive() {
                return this;
            },
            on(eventName, handler) {
                handlers[eventName] = handler;
                return this;
            },
            setFillStyle() {
                return this;
            }
        };
        const scene = {
            inputManager: {
                prepareUiInteraction: sceneInputPrepare
            },
            add: {
                text: () => btnText,
                rectangle: () => btnBg,
                container: (x, y, children) => ({ x, y, children })
            }
        };
        const factory = new ButtonFactory(scene, {
            prepareUiInteraction: injectedPrepare
        });

        factory.createButton('Talk', onClick);
        handlers.pointerdown({}, 0, 0, { stopPropagation });

        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(injectedPrepare).toHaveBeenCalledTimes(1);
        expect(sceneInputPrepare).not.toHaveBeenCalled();
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});