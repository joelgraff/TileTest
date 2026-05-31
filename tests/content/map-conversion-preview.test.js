import { describe, expect, it } from 'vitest';

import CONFIG from '../../config.js';
import {
    MAP_CONVERSION_PREVIEW_STATUS,
    createMapLayerConversionPreview,
    createMapLayerConversionPreviewReport,
    formatMapLayerConversionPreviewReport
} from '../../mapConversionPreview.js';
import { MAP_READINESS_CODES } from './mapReadiness.js';
import { getLayer, loadJson } from './testUtils.js';

function loadAssetMap(mapName) {
    return loadJson(`${CONFIG.PATHS.ASSETS}/${mapName}${CONFIG.PATHS.JSON_EXTENSION}`);
}

describe('map conversion preview', () => {
    it('creates a layer-only runtime preview without mutating the draft map', () => {
        const draftMap = loadAssetMap('vcf_map');
        const originalLayerNames = draftMap.layers.map(layer => layer.name);
        const { previewMap, steps, droppedLayers } = createMapLayerConversionPreview(draftMap);

        expect(draftMap.layers.map(layer => layer.name)).toEqual(originalLayerNames);
        expect(getLayer(draftMap, 'floor')).toBeUndefined();
        expect(previewMap.layers.map(layer => layer.name)).toEqual([
            'floor',
            'tables',
            'player',
            'npc_area',
            'tabletops'
        ]);
        expect(steps.map(step => step.status)).toEqual([
            MAP_CONVERSION_PREVIEW_STATUS.COPIED,
            MAP_CONVERSION_PREVIEW_STATUS.COPIED,
            MAP_CONVERSION_PREVIEW_STATUS.CREATED,
            MAP_CONVERSION_PREVIEW_STATUS.COPIED,
            MAP_CONVERSION_PREVIEW_STATUS.CREATED
        ]);
        expect(droppedLayers.map(layer => layer.name)).toEqual(['Image Layer 1']);
    });

    it('copies mapped draft layer data and creates empty placeholders for missing layers', () => {
        const draftMap = loadAssetMap('vcf_map');
        const { previewMap } = createMapLayerConversionPreview(draftMap);
        const floorSourceLayer = getLayer(draftMap, 'Tile Layer 1');
        const tablesSourceLayer = getLayer(draftMap, 'furniture');
        const zonesSourceLayer = getLayer(draftMap, 'zones');
        const floorLayer = getLayer(previewMap, 'floor');
        const tablesLayer = getLayer(previewMap, 'tables');
        const playerLayer = getLayer(previewMap, 'player');
        const npcAreaLayer = getLayer(previewMap, 'npc_area');
        const tabletopsLayer = getLayer(previewMap, 'tabletops');

        expect(floorLayer).not.toBe(floorSourceLayer);
        expect(floorLayer.data).toEqual(floorSourceLayer.data);
        expect(tablesLayer.data).toEqual(tablesSourceLayer.data);
        expect(playerLayer).toMatchObject({
            name: 'player',
            type: 'objectgroup',
            objects: []
        });
        expect(npcAreaLayer).not.toBe(zonesSourceLayer);
        expect(npcAreaLayer.objects).toEqual([]);
        expect(tabletopsLayer).toMatchObject({
            name: 'tabletops',
            type: 'tilelayer',
            width: 60,
            height: 65
        });
        expect(tabletopsLayer.data).toHaveLength(60 * 65);
        expect(tabletopsLayer.data.every(tileId => tileId === 0)).toBe(true);
        expect(new Set(previewMap.layers.map(layer => layer.id)).size).toBe(5);
        expect(previewMap.nextlayerid).toBe(7);
    });

    it('removes required-layer blockers while preserving remaining readiness blockers', () => {
        const report = createMapLayerConversionPreviewReport(loadAssetMap('vcf_map'));
        const blockingCodes = report.readinessReport.blockingIssues.map(issue => issue.code);

        expect(report.readinessReport.ready).toBe(false);
        expect(blockingCodes).not.toContain(MAP_READINESS_CODES.REQUIRED_LAYER_MISSING);
        expect(blockingCodes).toEqual(expect.arrayContaining([
            MAP_READINESS_CODES.PLAYER_START_MISSING,
            MAP_READINESS_CODES.NPC_AREA_RECT_MISSING,
            MAP_READINESS_CODES.NPC_SPAWN_POINTS_MISSING,
            MAP_READINESS_CODES.TILESET_MISSING,
            MAP_READINESS_CODES.EXTERNAL_TILESET_IMAGE,
            MAP_READINESS_CODES.EXTERNAL_TILESET_SOURCE,
            MAP_READINESS_CODES.COLLISION_LAYER_DEPTH_MISSING,
            MAP_READINESS_CODES.COLLISION_LAYER_EMPTY
        ]));
    });

    it('keeps the default runtime map ready when previewed', () => {
        const report = createMapLayerConversionPreviewReport(loadAssetMap(CONFIG.ASSETS.MAP));

        expect(report.previewMap.layers.map(layer => layer.name)).toEqual([
            'floor',
            'tables',
            'player',
            'npc_area',
            'tabletops'
        ]);
        expect(report.steps.every(step => step.status === MAP_CONVERSION_PREVIEW_STATUS.MATCHED)).toBe(true);
        expect(report.droppedLayers).toEqual([]);
        expect(report.readinessReport.ready).toBe(true);
        expect(report.readinessReport.blockingIssues).toEqual([]);
    });

    it('formats a preview report that is explicit about being in-memory only', () => {
        const reportText = formatMapLayerConversionPreviewReport(
            'assets/vcf_map.json',
            createMapLayerConversionPreviewReport(loadAssetMap('vcf_map'))
        );

        expect(reportText).toContain('Map layer conversion preview: assets/vcf_map.json');
        expect(reportText).toContain('Mode: in-memory only; no map files were changed.');
        expect(reportText).toContain('Preview layers: floor, tables, player, npc_area, tabletops');
        expect(reportText).toContain('- floor: copied tile layer from "Tile Layer 1" as "floor" [tile layer, 60x65, used tiles: 3900].');
        expect(reportText).toContain('- player: created empty object layer as "player" [object layer, objects: 0].');
        expect(reportText).toContain('- Image Layer 1 [image layer, image: ../../../Documents/VCF Tilesets/tilesets/vcfmw20_floorplan_A_tilemap_1040.png]');
        expect(reportText).toContain('Preview readiness status: not runtime-ready');
        expect(reportText).toContain('Remaining blocking issues:');
        expect(reportText).not.toContain('[REQUIRED_LAYER_MISSING]');
    });
});