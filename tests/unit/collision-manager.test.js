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
        const drawTileCollisionDebug = vi.spyOn(CollisionManager, 'drawTileCollisionDebug').mockImplementation(() => {});
        const addColliders = vi.spyOn(CollisionManager, 'addColliders').mockImplementation(() => {});

        CollisionManager.setupCollisions(scene);

        expect(scene.customCollisionBodies).toEqual([]);
        expect(map.getLayer).toHaveBeenCalledWith('tables');
        expect(map.getLayer).toHaveBeenCalledWith('tabletops');
        expect(createTileCollisionBodies).toHaveBeenCalledTimes(1);
        expect(createTileCollisionBodies).toHaveBeenCalledWith(scene, tablesTilemapLayer);
        expect(drawTileCollisionDebug).toHaveBeenCalledTimes(1);
        expect(drawTileCollisionDebug).toHaveBeenCalledWith(scene, tablesTilemapLayer);
        expect(addColliders).toHaveBeenCalledWith(scene);

        createTileCollisionBodies.mockRestore();
        drawTileCollisionDebug.mockRestore();
        addColliders.mockRestore();
    });

    it('registers collision bodies for the player and each NPC sprite', () => {
        const collider = vi.fn();
        const body1 = { id: 'body-1' };
        const body2 = { id: 'body-2' };
        const npc1 = { id: 'npc-1' };
        const npc2 = { id: 'npc-2' };
        const scene = {
            player: { id: 'player-1' },
            customCollisionBodies: [body1, body2],
            npcGroup: {
                getChildren: () => [npc1, npc2]
            },
            physics: {
                add: {
                    collider
                }
            }
        };

        CollisionManager.addColliders(scene);

        expect(collider).toHaveBeenCalledTimes(6);
        expect(collider).toHaveBeenNthCalledWith(1, scene.player, body1);
        expect(collider).toHaveBeenNthCalledWith(2, scene.player, body2);
        expect(collider).toHaveBeenNthCalledWith(3, npc1, body1);
        expect(collider).toHaveBeenNthCalledWith(4, npc1, body2);
        expect(collider).toHaveBeenNthCalledWith(5, npc2, body1);
        expect(collider).toHaveBeenNthCalledWith(6, npc2, body2);
    });
});