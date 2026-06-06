import { describe, expect, it } from 'vitest';

import CONFIG from '../../config.js';
import { buildMapRuntimeProfile } from '../../mapRuntimeProfile.js';
import { getLayer, getPropertyValue, loadJson } from './testUtils.js';

const collisionLayerNames = ['tables', 'tabletops'];

describe('map validation', () => {
    const map = loadJson(
        CONFIG.getAssetPath(CONFIG.ASSETS.MAP, CONFIG.PATHS.JSON_EXTENSION)
    );
    const runtimeProfile = buildMapRuntimeProfile(map, {
        packageName: CONFIG.ASSETS.PACKAGE,
        mapName: CONFIG.ASSETS.MAP
    });

    it('includes the required layers used by the runtime', () => {
        const requiredLayers = ['floor', 'tables', 'player', 'tabletops'];

        for (const layerName of requiredLayers) {
            expect(getLayer(map, layerName), `Missing required layer: ${layerName}`).toBeTruthy();
        }

        expect(
            runtimeProfile.npcAreaGroup ?? getLayer(map, 'npc_area'),
            'Missing required NPC placement layer: npc_area or npc_areas'
        ).toBeTruthy();
    });

    it('discovers a primary tileset used by the runtime map renderer', () => {
        expect(
            runtimeProfile.primaryTileset,
            'Missing primary tileset for runtime rendering'
        ).toBeTruthy();
        expect(runtimeProfile.primaryTileset?.packageImagePath).toBe(
            CONFIG.getAssetPath(CONFIG.ASSETS.TILES, CONFIG.PATHS.IMAGE_EXTENSION)
        );
    });

    it('defines exactly one player start point marker', () => {
        const playerLayer = getLayer(map, 'player');
        const startMarkers = playerLayer.objects.filter(object => object.name === 'start');

        expect(playerLayer.type).toBe('objectgroup');
        expect(Array.isArray(playerLayer.objects)).toBe(true);
        expect(startMarkers).toHaveLength(1);
        expect(startMarkers[0].point).toBe(true);
    });

    it('defines npc spawn points through the supported runtime placement contract', () => {
        const legacyNpcLayer = getLayer(map, 'npc_area');

        if (legacyNpcLayer) {
            const rectObjects = legacyNpcLayer.objects.filter(object => object.type === 'rect');
            const pointObjects = legacyNpcLayer.objects.filter(object => object.type === 'point');

            expect(legacyNpcLayer.type).toBe('objectgroup');
            expect(Array.isArray(legacyNpcLayer.objects)).toBe(true);
            expect(rectObjects).toHaveLength(1);
            expect(pointObjects.length).toBeGreaterThan(0);
            pointObjects.forEach(pointObject => {
                expect(pointObject.point).toBe(true);
            });
            return;
        }

        expect(runtimeProfile.npcAreaGroup?.name).toBe('npc_areas');
        expect(runtimeProfile.npcAreaLayers.length).toBeGreaterThan(0);

        const spawnPoints = runtimeProfile.npcAreaLayers.flatMap(layer => layer.spawnPoints);

        expect(spawnPoints.length).toBeGreaterThan(0);
        spawnPoints.forEach(point => {
            expect(point.object?.point).toBe(true);
        });
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

    it('defines map-level tabletop collision override properties', () => {
        expect(getPropertyValue(map, 'tabletopCollisionWidth')).toBeGreaterThan(0);
        expect(getPropertyValue(map, 'tabletopCollisionHeight')).toBeGreaterThan(0);
        expect(getPropertyValue(map, 'tabletopCollisionX')).toEqual(expect.any(Number));
        expect(getPropertyValue(map, 'tabletopCollisionY')).toEqual(expect.any(Number));
    });

    it('provides collision-capable tile dimensions for every used collision layer', () => {
        const tileWidth = runtimeProfile.primaryTileset?.tileWidth ?? map.tilewidth;
        const tileHeight = runtimeProfile.primaryTileset?.tileHeight ?? map.tileheight;

        expect(tileWidth).toBeGreaterThan(0);
        expect(tileHeight).toBeGreaterThan(0);

        for (const layerName of collisionLayerNames) {
            const layer = getLayer(map, layerName);
            const usedTileCount = layer.data.filter(tileId => tileId > 0).length;

            expect(usedTileCount, `Collision layer ${layerName} has no tiles`).toBeGreaterThan(0);
        }
    });
});