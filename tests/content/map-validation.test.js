import { describe, expect, it } from 'vitest';

import { getLayer, getPropertyValue, loadJson } from './testUtils.js';

const TILE_FLIP_FLAGS_MASK = 0x1fffffff;
const collisionLayerNames = ['tables', 'tabletops'];

function toLocalTileId(globalTileId) {
    const unflippedTileId = globalTileId & TILE_FLIP_FLAGS_MASK;

    return unflippedTileId > 0 ? unflippedTileId - 1 : -1;
}

function getEmbeddedTilesetCollisionObjects(map, tileId) {
    const embeddedTileset = map.tilesets[0];
    const tileDefinition = embeddedTileset?.tiles?.find(tile => tile.id === tileId);

    return tileDefinition?.objectgroup?.objects ?? [];
}

describe('map validation', () => {
    const map = loadJson('assets/map.json');

    it('includes the required layers used by the runtime', () => {
        const requiredLayers = ['floor', 'tables', 'player', 'npc_area'];

        for (const layerName of requiredLayers) {
            expect(getLayer(map, layerName), `Missing required layer: ${layerName}`).toBeTruthy();
        }
    });

    it('defines a player start marker', () => {
        const playerLayer = getLayer(map, 'player');

        expect(playerLayer.type).toBe('objectgroup');
        expect(Array.isArray(playerLayer.objects)).toBe(true);
        expect(playerLayer.objects.some(object => object.name === 'start')).toBe(true);
    });

    it('defines an npc area rectangle and spawn points', () => {
        const npcLayer = getLayer(map, 'npc_area');

        expect(npcLayer.type).toBe('objectgroup');
        expect(Array.isArray(npcLayer.objects)).toBe(true);
        expect(npcLayer.objects.some(object => object.type === 'rect')).toBe(true);
        expect(npcLayer.objects.some(object => object.type === 'point')).toBe(true);
    });

    it('defines explicit collision layer depth metadata', () => {
        for (const layerName of collisionLayerNames) {
            const layer = getLayer(map, layerName);

            expect(layer, `Missing collision layer: ${layerName}`).toBeTruthy();
            expect(layer.type).toBe('tilelayer');
            expect(
                getPropertyValue(layer, 'depth'),
                `Collision layer ${layerName} is missing a depth property`
            ).toEqual(expect.any(Number));
        }
    });

    it('defines collision rectangles for every tile used by collision layers', () => {
        for (const layerName of collisionLayerNames) {
            const layer = getLayer(map, layerName);
            const usedTileIds = new Set(
                layer.data
                    .filter(tileId => tileId > 0)
                    .map(tileId => toLocalTileId(tileId))
            );

            expect(usedTileIds.size, `Collision layer ${layerName} has no tiles`).toBeGreaterThan(0);

            for (const tileId of usedTileIds) {
                const collisionObjects = getEmbeddedTilesetCollisionObjects(map, tileId);

                expect(
                    collisionObjects.length,
                    `Tile ${tileId} used by ${layerName} is missing collision metadata`
                ).toBeGreaterThan(0);

                for (const collisionObject of collisionObjects) {
                    expect(
                        collisionObject.width,
                        `Tile ${tileId} in ${layerName} has a collision object without width`
                    ).toBeGreaterThan(0);
                    expect(
                        collisionObject.height,
                        `Tile ${tileId} in ${layerName} has a collision object without height`
                    ).toBeGreaterThan(0);
                }
            }
        }
    });
});