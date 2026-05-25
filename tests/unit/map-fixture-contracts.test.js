import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import CollisionManager from '../../collisionManager.js';
import NPCManager from '../../npcManager.js';
import PlayerManager from '../../playerManager.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function loadFixtureMap() {
    return JSON.parse(
        fs.readFileSync(path.resolve(currentDir, '../fixtures/collision-spawn-map.json'), 'utf8')
    );
}

function createFixtureTileset(map) {
    return {
        firstgid: map.tilesets[0].firstgid,
        tileData: Object.fromEntries(map.tilesets[0].tiles.map(tile => [tile.id, tile]))
    };
}

describe('fixture map contracts', () => {
    it('drives player and NPC spawn data from one shared map fixture', () => {
        const map = loadFixtureMap();
        const objectLayers = Object.fromEntries(
            map.layers
                .filter(layer => layer.type === 'objectgroup')
                .map(layer => [layer.name, layer])
        );
        const scene = {
            map: {
                getObjectLayer: vi.fn(layerName => objectLayers[layerName] ?? null)
            }
        };

        expect(PlayerManager.getPlayerStartPosition(scene)).toEqual({ x: 96, y: 128 });

        const npcAreaLayer = NPCManager.getNPCAreaLayer(scene);

        expect(NPCManager.getSpawnPoints(npcAreaLayer)).toEqual([
            { type: 'point', x: 64, y: 64, point: true },
            { type: 'point', x: 96, y: 64, point: true }
        ]);
        expect(NPCManager.getRectObject(npcAreaLayer)).toEqual({
            type: 'rect',
            x: 32,
            y: 32,
            width: 96,
            height: 64
        });
    });

    it('drives collision metadata from the same fixture tileset', () => {
        const map = loadFixtureMap();
        const tileset = createFixtureTileset(map);

        expect(CollisionManager.getTileCollisionObjects({ index: 1, tileset })).toEqual([
            { x: 0, y: 24, width: 32, height: 8 }
        ]);
        expect(CollisionManager.getTileCollisionObjects({ index: 2, tileset })).toEqual([
            { x: 0, y: 0, width: 8, height: 32 },
            { x: 24, y: 0, width: 8, height: 32 }
        ]);
        expect(CollisionManager.getTileCollisionObjects({ index: 3, tileset })).toEqual([
            { x: 0, y: 0, width: 32, height: 6 }
        ]);
    });
});