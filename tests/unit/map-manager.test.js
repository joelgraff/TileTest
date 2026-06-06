import { afterEach, describe, expect, it, vi } from 'vitest';

import CONFIG from '../../config.js';
import MapManager from '../../mapManager.js';

function createRuntimeReadyMapData() {
    return {
        layers: [
            { name: 'floor', type: 'tilelayer', data: [1] },
            { name: 'tables', type: 'tilelayer', data: [1], properties: [{ name: 'depth', value: 0 }] },
            { name: 'player', type: 'objectgroup', objects: [{ name: 'start', point: true }] },
            {
                name: 'npc_area',
                type: 'objectgroup',
                objects: [
                    { type: 'point', point: true },
                    { type: 'rect', width: 64, height: 64 }
                ]
            },
            { name: 'tabletops', type: 'tilelayer', data: [1], properties: [{ name: 'depth', value: 100 }] }
        ],
        tilesets: [
            {
                firstgid: 1,
                image: 'tiles.png',
                name: 'tiles',
                tiles: [
                    {
                        id: 0,
                        objectgroup: {
                            objects: [{ width: 32, height: 32 }]
                        }
                    }
                ]
            }
        ]
    };
}

describe('MapManager', () => {
    const originalPhaser = globalThis.Phaser;

    afterEach(() => {
        globalThis.Phaser = originalPhaser;
    });

    it('loads map and tiles from the selected asset package during preload', () => {
        const scene = {
            load: {
                tilemapTiledJSON: vi.fn(),
                image: vi.fn()
            }
        };

        MapManager.preload(scene, { packageName: '24px' });

        expect(scene.assetPackageName).toBe('24px');
        expect(scene.load.tilemapTiledJSON).toHaveBeenCalledWith(
            CONFIG.ASSETS.MAP,
            'assets/24px/map.json'
        );
        expect(scene.load.image).toHaveBeenCalledWith(
            CONFIG.ASSETS.TILES,
            'assets/24px/tiles.png'
        );
    });

    it('creates an explicit layer registry instead of exporting named layers on the scene', () => {
        globalThis.Phaser = {
            Math: {
                Clamp: vi.fn((value, min, max) => Math.min(Math.max(value, min), max))
            }
        };

        const floorLayer = { setDepth: vi.fn(function () { return this; }) };
        const tablesLayer = { setDepth: vi.fn(function () { return this; }) };
        const tabletopsLayer = { setDepth: vi.fn(function () { return this; }) };
        const map = {
            heightInPixels: 640,
            tileHeight: 32,
            layers: [
                { name: 'floor', properties: [{ name: 'depth', value: '0' }] },
                { name: 'tables', properties: [{ name: 'depth', value: '0' }] },
                { name: 'tabletops', properties: [{ name: 'depth', value: '100' }] }
            ],
            addTilesetImage: vi.fn(() => 'tileset'),
            createLayer: vi
                .fn()
                .mockReturnValueOnce(floorLayer)
                .mockReturnValueOnce(tablesLayer)
                .mockReturnValueOnce(tabletopsLayer)
        };
        const scene = {
            cache: {
                tilemap: {
                    get: vi.fn(() => ({ data: createRuntimeReadyMapData() }))
                }
            },
            make: {
                tilemap: vi.fn(() => map)
            }
        };

        const result = MapManager.create(scene);

        expect(result).toBe(scene.mapLayers);
        expect(scene.make.tilemap).toHaveBeenCalledWith({ key: CONFIG.ASSETS.MAP });
        expect(map.addTilesetImage).toHaveBeenCalledWith(CONFIG.ASSETS.TILES);
        expect(map.createLayer).toHaveBeenNthCalledWith(1, 'floor', 'tileset', 0, 0);
        expect(map.createLayer).toHaveBeenNthCalledWith(2, 'tables', 'tileset', 0, 0);
        expect(map.createLayer).toHaveBeenNthCalledWith(3, 'tabletops', 'tileset', 0, 0);
        expect(scene.mapLayers).toEqual({
            floor: floorLayer,
            tables: tablesLayer,
            tabletops: tabletopsLayer
        });
        expect(floorLayer.setDepth).toHaveBeenCalledWith(0);
        expect(tablesLayer.setDepth).toHaveBeenCalledWith(426);
        expect(tabletopsLayer.setDepth).toHaveBeenCalledWith(1280);
        expect(scene.tablesLayer).toBeUndefined();
    });

    it('attaches the discovered primary map tileset name to the preloaded texture key', () => {
        globalThis.Phaser = {
            Math: {
                Clamp: vi.fn((value, min, max) => Math.min(Math.max(value, min), max))
            }
        };

        const floorLayer = { setDepth: vi.fn(function () { return this; }) };
        const map = {
            heightInPixels: 640,
            tileHeight: 24,
            layers: [
                { name: 'floor', properties: [{ name: 'depth', value: '0' }] }
            ],
            addTilesetImage: vi.fn(() => 'tileset'),
            createLayer: vi.fn().mockReturnValue(floorLayer)
        };
        const scene = {
            mapRuntimeProfile: {
                primaryTileset: {
                    name: 'table tiles 24'
                }
            },
            make: {
                tilemap: vi.fn(() => map)
            }
        };

        const result = MapManager.create(scene, {
            validateLoadedMapBootContractFn: vi.fn(() => ({
                success: true,
                runtimeProfile: scene.mapRuntimeProfile
            }))
        });

        expect(result).toBe(scene.mapLayers);
        expect(map.addTilesetImage).toHaveBeenCalledWith('table tiles 24', CONFIG.ASSETS.TILES);
    });

    it('passes the selected asset package into map boot validation during create', () => {
        const validateLoadedMapBootContractFn = vi.fn(() => ({ success: false }));
        const scene = {
            assetPackageName: '24px'
        };

        const result = MapManager.create(scene, {
            validateLoadedMapBootContractFn
        });

        expect(result).toBeNull();
        expect(validateLoadedMapBootContractFn).toHaveBeenCalledWith(scene, {
            packageName: '24px'
        });
    });

    it('stops before creating Phaser layers when the cached map violates the runtime contract', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const scene = {
            cache: {
                tilemap: {
                    get: vi.fn(() => ({ data: { layers: [], tilesets: [] } }))
                }
            },
            make: {
                tilemap: vi.fn()
            }
        };

        const result = MapManager.create(scene);

        expect(result).toBeNull();
        expect(scene.mapLayers).toEqual({});
        expect(scene.make.tilemap).not.toHaveBeenCalled();
        expect(scene.mapBootFailure.message).toContain('does not satisfy the runtime map contract');
        expect(errorSpy).toHaveBeenCalledWith(scene.mapBootFailure.message);

        errorSpy.mockRestore();
    });
});
