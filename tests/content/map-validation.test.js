import { describe, expect, it } from 'vitest';

import { getLayer, loadJson } from './testUtils.js';

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
});