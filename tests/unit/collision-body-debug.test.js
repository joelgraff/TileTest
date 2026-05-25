import { describe, expect, it, vi } from 'vitest';

import { clearCollisionBodiesDebug, drawCollisionBodiesDebug } from '../../collisionBodyDebug.js';

function createGraphics() {
    return {
        clear: vi.fn(function () { return this; }),
        lineStyle: vi.fn(function () { return this; }),
        strokeRect: vi.fn(function () { return this; }),
        destroy: vi.fn(),
        setDepth: vi.fn(function () { return this; })
    };
}

describe('collision body debug', () => {
    it('creates and draws debug graphics for each collision body', () => {
        const graphics = createGraphics();
        const body = {
            body: {
                x: 10,
                y: 20,
                width: 30,
                height: 40
            },
            debugGraphics: null
        };
        const scene = {
            add: {
                graphics: vi.fn(() => graphics)
            }
        };

        const result = drawCollisionBodiesDebug(scene, [body]);

        expect(result).toEqual([body]);
        expect(scene.add.graphics).toHaveBeenCalledTimes(1);
        expect(graphics.setDepth).toHaveBeenCalledWith(999);
        expect(graphics.clear).toHaveBeenCalledTimes(1);
        expect(graphics.lineStyle).toHaveBeenCalledWith(2, 0xff0000, 1);
        expect(graphics.strokeRect).toHaveBeenCalledWith(10, 20, 30, 40);
        expect(body.debugGraphics).toBe(graphics);
    });

    it('destroys existing debug graphics when clearing collision body debug state', () => {
        const debugGraphics = { destroy: vi.fn() };
        const body = { debugGraphics };

        const result = clearCollisionBodiesDebug([body]);

        expect(result).toEqual([body]);
        expect(debugGraphics.destroy).toHaveBeenCalledTimes(1);
        expect(body.debugGraphics).toBe(null);
    });
});