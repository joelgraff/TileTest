import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearTileCollisionDebug, renderTileCollisionDebug } from '../../collisionTileDebug.js';

function createGraphics() {
    return {
        clear: vi.fn(function () { return this; }),
        lineStyle: vi.fn(function () { return this; }),
        strokeRect: vi.fn(function () { return this; }),
        strokeLineShape: vi.fn(function () { return this; }),
        destroy: vi.fn(),
        setAlpha: vi.fn(function () { return this; }),
        setDepth: vi.fn(function () { return this; })
    };
}

describe('collision tile debug', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
    });

    it('renders rectangle and polygon collision debug shapes for a tile layer', () => {
        globalThis.Phaser = {
            Geom: {
                Line: class Line {
                    constructor(x1, y1, x2, y2) {
                        this.x1 = x1;
                        this.y1 = y1;
                        this.x2 = x2;
                        this.y2 = y2;
                    }
                }
            }
        };

        const graphics = createGraphics();
        const tilemapLayer = {
            customDebugGraphics: null,
            forEachTile: (visitTile) => {
                visitTile({ index: -1 });
                visitTile({ index: 12, pixelX: 96, pixelY: 128 });
            }
        };
        const scene = {
            add: {
                graphics: vi.fn(() => graphics)
            }
        };
        const getTileCollisionObjects = vi.fn((tile) => tile.index === -1
            ? []
            : [
                { x: 4, y: 6, width: 8, height: 10 },
                { x: 10, y: 20, polygon: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 6 }] }
            ]);

        const result = renderTileCollisionDebug(scene, tilemapLayer, { getTileCollisionObjects });

        expect(result).toBe(graphics);
        expect(scene.add.graphics).toHaveBeenCalledTimes(1);
        expect(graphics.setAlpha).toHaveBeenCalledWith(1);
        expect(graphics.setDepth).toHaveBeenCalledWith(999);
        expect(graphics.clear).toHaveBeenCalledTimes(1);
        expect(graphics.strokeRect).toHaveBeenCalledWith(100, 134, 8, 10);
        expect(graphics.strokeLineShape).toHaveBeenCalledTimes(3);
        expect(tilemapLayer.customDebugGraphics).toBe(graphics);
    });

    it('destroys and clears tile debug graphics when requested', () => {
        const customDebugGraphics = { destroy: vi.fn() };
        const tilemapLayer = { customDebugGraphics };

        const result = clearTileCollisionDebug(tilemapLayer);

        expect(result).toBe(tilemapLayer);
        expect(customDebugGraphics.destroy).toHaveBeenCalledTimes(1);
        expect(tilemapLayer.customDebugGraphics).toBe(null);
    });
});