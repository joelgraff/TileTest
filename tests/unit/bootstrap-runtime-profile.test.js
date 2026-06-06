import { describe, expect, it, vi } from 'vitest';

import {
    buildNPCSpriteKeys,
    createBootstrapPreloadOptions,
    loadBootstrapRuntimeProfile
} from '../../bootstrapRuntimeProfile.js';

describe('bootstrap runtime profile', () => {
    it('generates zero-padded npc sprite keys from runtime profile metadata', () => {
        const spriteKeys = buildNPCSpriteKeys({
            sprite: {
                count: 3
            }
        });

        expect(spriteKeys).toEqual(['npc_001', 'npc_002', 'npc_003']);
    });

    it('falls back to configured npc sprite keys when runtime profile count is unavailable', () => {
        expect(buildNPCSpriteKeys(null)).toEqual(['npc1', 'npc2']);
    });

    it('creates package-aware preload options from runtime profile metadata', () => {
        const options = createBootstrapPreloadOptions({
            packageName: '24px',
            sprite: {
                count: 2,
                frameWidth: 24,
                frameHeight: 36
            }
        });

        expect(options).toEqual({
            packageName: '24px',
            player: {
                packageName: '24px',
                frameWidth: 24,
                frameHeight: 36
            },
            npc: {
                packageName: '24px',
                spriteKeys: ['npc_001', 'npc_002'],
                frameWidth: 24,
                frameHeight: 36
            }
        });
    });

    it('loads and normalizes the selected package map before Phaser preload starts', async () => {
        const fetchFn = vi.fn(async () => ({
            ok: true,
            json: async () => ({
                tilewidth: 24,
                tileheight: 24,
                properties: [
                    { name: 'spriteFrameWidth', value: 24 },
                    { name: 'spriteFrameHeight', value: 36 },
                    { name: 'spriteSpriteCount', value: 2 }
                ],
                layers: [],
                tilesets: [
                    {
                        firstgid: 1,
                        name: 'table tiles 24',
                        image: '../../../../Documents/VCF Tilesets/tilesets/table_tiles-24.png'
                    }
                ]
            })
        }));

        const runtimeProfile = await loadBootstrapRuntimeProfile({
            fetchFn,
            packageName: '24px'
        });

        expect(fetchFn).toHaveBeenCalledWith('assets/24px/map.json');
        expect(runtimeProfile).toEqual(expect.objectContaining({
            packageName: '24px',
            mapPath: 'assets/24px/map.json',
            tileWidth: 24,
            tileHeight: 24
        }));
        expect(runtimeProfile.primaryTileset).toEqual(expect.objectContaining({
            name: 'table tiles 24'
        }));
    });
});