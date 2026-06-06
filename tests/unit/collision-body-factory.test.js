import { describe, expect, it, vi } from 'vitest';

import {
    createTileCollisionBodiesForLayer,
    getTileCollisionObjects
} from '../../collisionBodyFactory.js';

describe('collision body factory', () => {
    it('resolves tile collision objects using the tileset local id', () => {
        const tile = {
            index: 11,
            tileset: {
                firstgid: 10,
                tileData: {
                    1: {
                        objectgroup: {
                            objects: [{ x: 4, y: 6, width: 8, height: 10 }]
                        }
                    }
                }
            }
        };

        expect(getTileCollisionObjects(tile)).toEqual([
            { x: 4, y: 6, width: 8, height: 10, offsetX: 4, offsetY: 6 }
        ]);
        expect(getTileCollisionObjects({ index: 1, tileset: null })).toEqual([]);
    });

    it('falls back to a full-tile collision rectangle when embedded metadata is absent', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {},
                tileWidth: 24,
                tileHeight: 24
            }
        };

        expect(getTileCollisionObjects(tile)).toEqual([
            { x: 0, y: 0, width: 24, height: 24 }
        ]);
    });

    it('uses map-level tabletop collision properties when tabletop tiles omit embedded metadata', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {},
                tileWidth: 24,
                tileHeight: 24
            }
        };
        const tilemapLayer = {
            layer: {
                name: 'tabletops'
            },
            tilemap: {
                properties: [
                    { name: 'tabletopCollisionWidth', value: 24 },
                    { name: 'tabletopCollisionHeight', value: 5 },
                    { name: 'tabletopCollisionX', value: 0 },
                    { name: 'tabletopCollisionY', value: 19 }
                ]
            }
        };

        expect(getTileCollisionObjects(tile, tilemapLayer)).toEqual([
            { x: 0, y: 19, width: 24, height: 5, offsetX: 0, offsetY: 19 }
        ]);
    });

    it('uses map-level table collision properties when tables tiles omit embedded metadata', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {},
                tileWidth: 24,
                tileHeight: 24
            }
        };
        const tilemapLayer = {
            layer: {
                name: 'tables'
            },
            tilemap: {
                tilewidth: 24,
                tileheight: 24,
                properties: [
                    { name: 'tableCollisionWidth', value: 24 },
                    { name: 'tableCollisionHeight', value: 5 },
                    { name: 'tableCollisionX', value: 0 },
                    { name: 'tableCollisionY', value: 19 }
                ]
            }
        };

        expect(getTileCollisionObjects(tile, tilemapLayer)).toEqual([
            { x: 0, y: 19, width: 24, height: 5, offsetX: 0, offsetY: 19 }
        ]);
    });

    it('resolves embedded table collision boxes with -1 dimensions to the tile size', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {
                    2: {
                        objectgroup: {
                            objects: [{ x: -1, y: -1, width: -1, height: -1 }]
                        }
                    }
                },
                tileWidth: 24,
                tileHeight: 24
            }
        };
        const tilemapLayer = {
            layer: {
                name: 'tables'
            },
            tilemap: null
        };

        expect(getTileCollisionObjects(tile, tilemapLayer)).toEqual([
            { x: 0, y: 0, width: 24, height: 24, offsetX: 0, offsetY: 0 }
        ]);
    });

    it('resolves map-level table collision properties set to -1 to the tile size', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {},
                tileWidth: 24,
                tileHeight: 24
            }
        };
        const tilemapLayer = {
            layer: {
                name: 'tables'
            },
            tilemap: {
                tilewidth: 24,
                tileheight: 24,
                properties: [
                    { name: 'tableCollisionWidth', value: -1 },
                    { name: 'tableCollisionHeight', value: -1 },
                    { name: 'tableCollisionX', value: -1 },
                    { name: 'tableCollisionY', value: -1 }
                ]
            }
        };

        expect(getTileCollisionObjects(tile, tilemapLayer)).toEqual([
            { x: 0, y: 0, width: 24, height: 24, offsetX: 0, offsetY: 0 }
        ]);
    });

    it('disables tabletop collision boxes when either map dimension is zero', () => {
        const tile = {
            index: 12,
            width: 24,
            height: 24,
            tileset: {
                firstgid: 10,
                tileData: {},
                tileWidth: 24,
                tileHeight: 24
            }
        };
        const tilemapLayer = {
            layer: {
                name: 'tabletops'
            },
            tilemap: {
                properties: [
                    { name: 'tabletopCollisionWidth', value: 0 },
                    { name: 'tabletopCollisionHeight', value: 5 },
                    { name: 'tabletopCollisionX', value: 0 },
                    { name: 'tabletopCollisionY', value: 19 }
                ]
            }
        };

        expect(getTileCollisionObjects(tile, tilemapLayer)).toEqual([]);
    });

    it('creates static collision bodies for rectangular tile collision objects', () => {
        const body = {
            setSize: vi.fn(function () { return this; }),
            visible: true
        };
        const scene = {
            physics: {
                add: {
                    staticSprite: vi.fn(() => body)
                }
            },
            customCollisionBodies: []
        };
        const tilemapLayer = {
            depth: 14,
            forEachTile: (visitTile) => {
                visitTile({
                    index: -1
                });
                visitTile({
                    index: 12,
                    x: 3,
                    y: 4,
                    pixelX: 96,
                    pixelY: 128
                });
            }
        };
        const resolveTileCollisionObjects = vi.fn((tile) => tile.index === -1
            ? []
            : [
                { x: 4, y: 6, width: 8, height: 10 },
                { polygon: [{ x: 0, y: 0 }] }
            ]);

        const createdBodies = createTileCollisionBodiesForLayer(scene, tilemapLayer, {
            getTileCollisionObjects: resolveTileCollisionObjects
        });

        expect(scene.physics.add.staticSprite).toHaveBeenCalledTimes(1);
        expect(scene.physics.add.staticSprite).toHaveBeenCalledWith(104, 139, null);
        expect(body.setSize).toHaveBeenCalledWith(8, 10);
        expect(body.visible).toBe(false);
        expect(body.tileInfo).toEqual({
            id: 12,
            x: 3,
            y: 4,
            pixelX: 96,
            pixelY: 128,
            depth: 14
        });
        expect(createdBodies).toEqual([body]);
    });
});