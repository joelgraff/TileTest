import { describe, expect, it, vi } from 'vitest';

import {
    createTileCollisionBodiesForLayer,
    getTileCollisionObjects
} from '../../collisionBodyFactory.js';

describe('collision body factory', () => {
    it('resolves tile collision objects using the tileset local id', () => {
        const collisionObjects = [{ x: 4, y: 6, width: 8, height: 10 }];
        const tile = {
            index: 11,
            tileset: {
                firstgid: 10,
                tileData: {
                    1: {
                        objectgroup: {
                            objects: collisionObjects
                        }
                    }
                }
            }
        };

        expect(getTileCollisionObjects(tile)).toEqual(collisionObjects);
        expect(getTileCollisionObjects({ index: 1, tileset: null })).toEqual([]);
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