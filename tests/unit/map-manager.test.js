import { afterEach, describe, expect, it, vi } from 'vitest';

import MapManager from '../../mapManager.js';

describe('MapManager', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
    });

    it('creates an explicit layer registry instead of exporting named layers on the scene', () => {
        globalThis.Phaser = {
            Math: {
                Clamp: vi.fn((value, min, max) => Math.min(Math.max(value, min), max))
            }
        };

        const backgroundLayer = { setDepth: vi.fn(function () { return this; }) };
        const tablesLayer = { setDepth: vi.fn(function () { return this; }) };
        const map = {
            heightInPixels: 640,
            tileHeight: 32,
            layers: [
                { name: 'background', properties: [{ name: 'depth', value: '0' }] },
                { name: 'tables', properties: [{ name: 'depth', value: '2' }] }
            ],
            addTilesetImage: vi.fn(() => 'tileset'),
            createLayer: vi
                .fn()
                .mockReturnValueOnce(backgroundLayer)
                .mockReturnValueOnce(tablesLayer)
        };
        const scene = {
            make: {
                tilemap: vi.fn(() => map)
            }
        };

        const result = MapManager.create(scene);

        expect(result).toBe(scene.mapLayers);
        expect(scene.make.tilemap).toHaveBeenCalledWith({ key: 'map' });
        expect(map.addTilesetImage).toHaveBeenCalledWith('tiles');
        expect(map.createLayer).toHaveBeenNthCalledWith(1, 'background', 'tileset', 0, 0);
        expect(map.createLayer).toHaveBeenNthCalledWith(2, 'tables', 'tileset', 0, 0);
        expect(scene.mapLayers).toEqual({
            background: backgroundLayer,
            tables: tablesLayer
        });
        expect(backgroundLayer.setDepth).toHaveBeenCalledWith(0);
        expect(tablesLayer.setDepth).toHaveBeenCalledWith(704);
        expect(scene.tablesLayer).toBeUndefined();
    });
});