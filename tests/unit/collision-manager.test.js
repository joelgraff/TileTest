import { describe, expect, it, vi } from 'vitest';

import CollisionManager from '../../collisionManager.js';

describe('CollisionManager setup', () => {
    it('processes only collidable tilemap layers before adding colliders', () => {
        const tablesTilemapLayer = { id: 'tables-layer' };
        const map = {
            getLayer: vi.fn((layerName) => {
                if (layerName === 'tables') {
                    return { tilemapLayer: tablesTilemapLayer };
                }

                return { tilemapLayer: null };
            })
        };
        const scene = { map };
        const createTileCollisionBodies = vi.spyOn(CollisionManager, 'createTileCollisionBodies').mockImplementation(() => {});
        const addColliders = vi.spyOn(CollisionManager, 'addColliders').mockImplementation(() => {});

        CollisionManager.setupCollisions(scene);

        expect(scene.customCollisionBodies).toEqual([]);
        expect(map.getLayer).toHaveBeenCalledWith('tables');
        expect(map.getLayer).toHaveBeenCalledWith('tabletops');
        expect(createTileCollisionBodies).toHaveBeenCalledTimes(1);
        expect(createTileCollisionBodies).toHaveBeenCalledWith(scene, tablesTilemapLayer);
        expect(addColliders).toHaveBeenCalledWith(scene);

        createTileCollisionBodies.mockRestore();
        addColliders.mockRestore();
    });

    it('registers collision bodies for the player only', () => {
        const collider = vi.fn();
        const body1 = { id: 'body-1' };
        const body2 = { id: 'body-2' };
        const scene = {
            player: { id: 'player-1' },
            customCollisionBodies: [body1, body2],
            npcGroup: {
                getChildren: () => []
            },
            physics: {
                add: {
                    collider
                }
            }
        };

        CollisionManager.addColliders(scene);

        expect(collider).toHaveBeenCalledTimes(2);
        expect(collider).toHaveBeenNthCalledWith(1, scene.player, body1);
        expect(collider).toHaveBeenNthCalledWith(2, scene.player, body2);
    });
});