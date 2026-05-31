import { describe, expect, it } from 'vitest';

import CONFIG from '../../config.js';
import {
    MAP_LAYER_MAPPING_STATUS,
    MAP_READINESS_ACTION_IDS,
    MAP_READINESS_CODES,
    MAP_READINESS_SEVERITY,
    formatMapReadinessReport,
    getMapReadinessReport
} from './mapReadiness.js';
import { loadJson } from './testUtils.js';

function loadAssetMap(mapName) {
    return loadJson(`${CONFIG.PATHS.ASSETS}/${mapName}${CONFIG.PATHS.JSON_EXTENSION}`);
}

describe('full map readiness', () => {
    it('keeps the current default runtime map ready', () => {
        const report = getMapReadinessReport(loadAssetMap(CONFIG.ASSETS.MAP));

        expect(report.ready).toBe(true);
        expect(report.blockingIssues).toEqual([]);
        expect(report.actionPlan).toEqual([]);
        expect(report.layerMappingHints.map(hint => hint.status)).toEqual([
            MAP_LAYER_MAPPING_STATUS.MATCHED,
            MAP_LAYER_MAPPING_STATUS.MATCHED,
            MAP_LAYER_MAPPING_STATUS.MATCHED,
            MAP_LAYER_MAPPING_STATUS.MATCHED,
            MAP_LAYER_MAPPING_STATUS.MATCHED
        ]);
    });

    it('reports the draft full VCF map as not runtime-ready with actionable blockers', () => {
        const report = getMapReadinessReport(loadAssetMap('vcf_map'));

        expect(report.ready).toBe(false);
        expect(report.blockingIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                message: 'Missing required runtime layer "floor".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                message: 'Missing required runtime layer "tables".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                message: 'Missing required runtime layer "player".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                message: 'Missing required runtime layer "npc_area".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                message: 'Missing required runtime layer "tabletops".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.PLAYER_START_MISSING,
                message: 'Missing player start marker: add one point object named "start" on layer "player".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.NPC_AREA_RECT_MISSING,
                message: 'Missing NPC area rectangle: add exactly one object with type "rect" on layer "npc_area".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.NPC_SPAWN_POINTS_MISSING,
                message: 'Missing NPC spawn points: add one or more point objects on layer "npc_area".'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.TILESET_MISSING,
                message: 'Missing required tileset "tiles"; MapManager calls addTilesetImage("tiles") for runtime maps.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.EXTERNAL_IMAGE_REFERENCE,
                message: 'Image layer "Image Layer 1" references external image "../../../Documents/VCF Tilesets/tilesets/vcfmw20_floorplan_A_tilemap_1040.png"; bundle it under assets/ or convert it to tile data before switching maps.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.EXTERNAL_TILESET_IMAGE,
                message: 'Tileset "vcf" references external image "../../../Documents/VCF Tilesets/tilesets/tilea5.png"; bundle it under assets/ before switching maps.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.EXTERNAL_TILESET_SOURCE,
                message: 'Tileset at firstgid 1 references external source "../../../Documents/VCF Tilesets/tilesets/modern office.tsx"; embed tileset data in the map JSON before switching maps.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.COLLISION_LAYER_MISSING,
                message: 'Missing collision layer "tables"; collision bodies are built from layers: tables, tabletops.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.BLOCKING,
                code: MAP_READINESS_CODES.COLLISION_LAYER_MISSING,
                message: 'Missing collision layer "tabletops"; collision bodies are built from layers: tables, tabletops.'
            })
        ]));
    });

    it('separates draft-map notes from blocking readiness failures', () => {
        const report = getMapReadinessReport(loadAssetMap('vcf_map'));

        expect(report.infoIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.INFO,
                code: MAP_READINESS_CODES.DRAFT_LAYER_PRESENT,
                message: 'Layer "Tile Layer 1" is not part of the current runtime layer contract; rename, map, or intentionally ignore it before switching maps.'
            }),
            expect.objectContaining({
                severity: MAP_READINESS_SEVERITY.INFO,
                code: MAP_READINESS_CODES.IMAGE_LAYER_PRESENT,
                message: 'Image layer "Image Layer 1" is present; MapManager currently renders tile layers, so confirm the draft does not rely on this image at runtime.'
            })
        ]));
    });

    it('summarizes draft-map inventory for conversion planning', () => {
        const report = getMapReadinessReport(loadAssetMap('vcf_map'));

        expect(report.inventory.dimensions).toMatchObject({
            width: 60,
            height: 65,
            tilewidth: 16,
            tileheight: 16
        });
        expect(report.inventory.layers).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: 'Tile Layer 1',
                type: 'tilelayer',
                width: 60,
                height: 65,
                usedTileCount: 3900
            }),
            expect.objectContaining({
                name: 'furniture',
                type: 'tilelayer',
                width: 60,
                height: 65,
                usedTileCount: 1546
            }),
            expect.objectContaining({
                name: 'zones',
                type: 'objectgroup',
                objectCount: 0,
                objectTypeCounts: []
            })
        ]));
        expect(report.inventory.tilesets).toEqual(expect.arrayContaining([
            expect.objectContaining({
                label: 'vcf at firstgid 1',
                image: '../../../Documents/VCF Tilesets/tilesets/tilea5.png',
                imageIsExternal: true
            }),
            expect.objectContaining({
                label: 'firstgid 1',
                source: '../../../Documents/VCF Tilesets/tilesets/modern office.tsx',
                sourceIsExternal: true
            })
        ]));
    });

    it('adds a grouped action plan to the draft-map report', () => {
        const report = getMapReadinessReport(loadAssetMap('vcf_map'));

        expect(report.actionPlan.map(action => action.id)).toEqual([
            MAP_READINESS_ACTION_IDS.RUNTIME_LAYERS,
            MAP_READINESS_ACTION_IDS.TILESET_BUNDLING,
            MAP_READINESS_ACTION_IDS.PLAYER_START,
            MAP_READINESS_ACTION_IDS.NPC_PLACEMENT,
            MAP_READINESS_ACTION_IDS.COLLISION_AUTHORING,
            MAP_READINESS_ACTION_IDS.IMAGE_LAYERS
        ]);
        expect(report.actionPlan).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: MAP_READINESS_ACTION_IDS.RUNTIME_LAYERS,
                issueCodes: expect.arrayContaining([
                    MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                    MAP_READINESS_CODES.DRAFT_LAYER_PRESENT
                ])
            }),
            expect.objectContaining({
                id: MAP_READINESS_ACTION_IDS.NPC_PLACEMENT,
                issueCodes: expect.arrayContaining([
                    MAP_READINESS_CODES.NPC_AREA_RECT_MISSING,
                    MAP_READINESS_CODES.NPC_SPAWN_POINTS_MISSING
                ])
            })
        ]));
    });

    it('suggests draft layer mappings for missing runtime layers', () => {
        const report = getMapReadinessReport(loadAssetMap('vcf_map'));

        expect(report.layerMappingHints).toEqual([
            expect.objectContaining({
                runtimeLayer: 'floor',
                status: MAP_LAYER_MAPPING_STATUS.CANDIDATE,
                sourceLayer: 'Tile Layer 1',
                expectedType: 'tilelayer',
                summary: 'tilelayer, 60x65, used tiles: 3900'
            }),
            expect.objectContaining({
                runtimeLayer: 'tables',
                status: MAP_LAYER_MAPPING_STATUS.CANDIDATE,
                sourceLayer: 'furniture',
                expectedType: 'tilelayer',
                summary: 'tilelayer, 60x65, used tiles: 1546'
            }),
            expect.objectContaining({
                runtimeLayer: 'player',
                status: MAP_LAYER_MAPPING_STATUS.MISSING,
                sourceLayer: undefined,
                expectedType: 'objectgroup'
            }),
            expect.objectContaining({
                runtimeLayer: 'npc_area',
                status: MAP_LAYER_MAPPING_STATUS.CANDIDATE,
                sourceLayer: 'zones',
                expectedType: 'objectgroup',
                summary: 'objectgroup, objects: 0, object types: none'
            }),
            expect.objectContaining({
                runtimeLayer: 'tabletops',
                status: MAP_LAYER_MAPPING_STATUS.MISSING,
                sourceLayer: undefined,
                expectedType: 'tilelayer'
            })
        ]);
    });

    it('formats inventory and next actions in the CLI report', () => {
        const reportText = formatMapReadinessReport(
            'assets/vcf_map.json',
            getMapReadinessReport(loadAssetMap('vcf_map'))
        );

        expect(reportText).toContain('Map inventory:');
        expect(reportText).toContain('- Size: 60x65 tiles; tile size: 16x16px');
        expect(reportText).toContain('- Tile Layer 1 [tilelayer, 60x65, used tiles: 3900]');
        expect(reportText).toContain('- zones [objectgroup, objects: 0, object types: none]');
        expect(reportText).toContain('- vcf at firstgid 1 [image: ../../../Documents/VCF Tilesets/tilesets/tilea5.png (external), tilecount: 0, embedded tile definitions: 0]');
        expect(reportText).toContain('Layer mapping hints: 5');
        expect(reportText).toContain('- floor: Runtime layer "floor" is missing; candidate draft layer "Tile Layer 1" matches the expected tile layer shape [tilelayer, 60x65, used tiles: 3900]. Rename or copy it intentionally if this is the right role.');
        expect(reportText).toContain('- player: Runtime layer "player" is missing; create an object layer named "player".');
        expect(reportText).toContain('- tabletops: Runtime layer "tabletops" is missing; create a tile layer named "tabletops".');
        expect(reportText).toContain('Next actions: 6');
        expect(reportText).toContain('1. Create runtime layer contract:');
        expect(reportText).toContain('Required runtime layers: floor, tables, player, npc_area, tabletops.');
        expect(reportText).toContain('4. Author NPC placement objects:');
    });
});