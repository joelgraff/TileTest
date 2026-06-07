import { describe, expect, it, vi } from 'vitest';

import {
    buildMapRuntimeProfile,
    flattenLayerTree,
    getNPCSpriteKeys,
    loadMapRuntimeProfile
} from '../../mapRuntimeProfile.js';

function createGroupedMapData() {
    return {
        tilewidth: 24,
        tileheight: 24,
        layers: [
            { name: 'floor', type: 'tilelayer', data: [1] },
            {
                name: 'npc_areas',
                type: 'group',
                layers: [
                    {
                        name: 'area_001',
                        type: 'objectgroup',
                        properties: [{ name: 'defaultFacing', value: 'left' }],
                        objects: [
                            {
                                name: 'spawn-a',
                                point: true,
                                x: 24,
                                y: 48,
                                properties: [{ name: 'facing', value: 'up' }]
                            },
                            {
                                name: 'spawn-b',
                                point: true,
                                x: 72,
                                y: 96
                            }
                        ]
                    }
                ]
            }
        ],
        properties: [
            { name: 'spriteFrameWidth', value: 24 },
            { name: 'spriteFrameHeight', value: 36 },
            { name: 'spriteFrameRate', value: 8 },
            { name: 'spriteSpriteCount', value: 16 },
            { name: 'vendorUpOffset', value: -18 },
            { name: 'vendorDownOffset', value: 6 },
            { name: 'vendorLeftOffset', value: -6 },
            { name: 'vendorRightOffset', value: 6 }
        ],
        tilesets: [
            {
                firstgid: 1,
                image: '../../../../Documents/VCF Tilesets/tilesets/table_tiles-24.png',
                name: 'table tiles 24',
                tilewidth: 24,
                tileheight: 24
            }
        ]
    };
}

describe('mapRuntimeProfile', () => {
    it('flattens nested layer paths for grouped map data', () => {
        const layers = flattenLayerTree(createGroupedMapData().layers);

        expect(layers.map(layer => layer.path.join('/'))).toEqual([
            'floor',
            'npc_areas',
            'npc_areas/area_001'
        ]);
    });

    it('normalizes grouped npc areas, compatibility sprite properties, and package-local tileset targets', () => {
        const profile = buildMapRuntimeProfile(createGroupedMapData(), {
            packageName: '24px',
            mapName: 'map'
        });

        expect(profile.packageRoot).toBe('assets/24px');
        expect(profile.mapPath).toBe('assets/24px/map.json');
        expect(profile.tileWidth).toBe(24);
        expect(profile.tileHeight).toBe(24);
        expect(profile.npcAreaGroup?.name).toBe('npc_areas');
        expect(profile.npcAreaLayers).toHaveLength(1);
        expect(profile.npcAreaLayers[0].path).toEqual(['npc_areas', 'area_001']);
        expect(profile.npcAreaLayers[0].defaultFacing).toBe('left');
        expect(profile.npcAreaLayers[0].spawnPoints.map(point => point.resolvedFacing)).toEqual(['up', 'left']);
        expect(profile.sprite.count).toBe(16);
        expect(profile.sprite.countProperty).toBe('spriteSpriteCount');
        expect(profile.vendorUpOffset).toBe(-18);
        expect(profile.vendorDownOffset).toBe(6);
        expect(profile.vendorLeftOffset).toBe(-6);
        expect(profile.vendorRightOffset).toBe(6);
        expect(profile.compatibility.usedLegacySpriteCountProperty).toBe(true);
        expect(profile.tilesets[0].imageFileName).toBe('table_tiles-24.png');
        expect(profile.tilesets[0].packageImagePath).toBe('assets/24px/table_tiles-24.png');
        expect(profile.tilesets[0].externalImage).toBe(true);
    });

    it('generates npc sprite keys from count metadata using the default package convention', () => {
        const profile = buildMapRuntimeProfile(createGroupedMapData(), {
            packageName: '24px',
            mapName: 'map'
        });

        expect(getNPCSpriteKeys(profile)).toEqual([
            'npc_001',
            'npc_002',
            'npc_003',
            'npc_004',
            'npc_005',
            'npc_006',
            'npc_007',
            'npc_008',
            'npc_009',
            'npc_010',
            'npc_011',
            'npc_012',
            'npc_013',
            'npc_014',
            'npc_015',
            'npc_016'
        ]);
    });

    it('loads and normalizes a runtime profile through fetch before preload', async () => {
        const fetchFn = vi.fn(async () => ({
            ok: true,
            json: async () => createGroupedMapData()
        }));

        const profile = await loadMapRuntimeProfile({
            fetchFn,
            packageName: '24px'
        });

        expect(fetchFn).toHaveBeenCalledWith('assets/24px/map.json', { cache: 'no-store' });
        expect(profile.mapPath).toBe('assets/24px/map.json');
        expect(profile.sprite.frameWidth).toBe(24);
    });
});