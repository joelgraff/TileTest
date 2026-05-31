import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    getCachedTilemapData,
    validateLoadedMapBootContract,
    validateMapBootContract
} from '../../mapBootGuard.js';

function createRuntimeReadyMapData() {
    return {
        layers: [
            { name: 'floor', type: 'tilelayer', data: [1] },
            { name: 'tables', type: 'tilelayer', data: [1], properties: [{ name: 'depth', value: 0 }] },
            {
                name: 'player',
                type: 'objectgroup',
                objects: [{ name: 'start', point: true }]
            },
            {
                name: 'npc_area',
                type: 'objectgroup',
                objects: [
                    { type: 'point', point: true },
                    { type: 'rect', width: 64, height: 64 }
                ]
            },
            { name: 'tabletops', type: 'tilelayer', data: [1], properties: [{ name: 'depth', value: 100 }] }
        ],
        tilesets: [
            {
                firstgid: 1,
                image: 'tiles.png',
                name: 'tiles',
                tiles: [
                    {
                        id: 0,
                        objectgroup: {
                            objects: [{ width: 32, height: 32 }]
                        }
                    }
                ]
            }
        ]
    };
}

function createFakeDocument() {
    class FakeElement {
        constructor(tagName) {
            this.tagName = tagName;
            this.attributes = {};
            this.children = [];
            this.className = '';
            this.style = {};
            this.textContent = '';
        }

        append(child) {
            this.children.push(child);
        }

        setAttribute(name, value) {
            this.attributes[name] = value;
        }
    }

    const overlayRoot = new FakeElement('div');

    return {
        documentRef: {
            body: new FakeElement('body'),
            createElement: tagName => new FakeElement(tagName),
            getElementById: id => (id === 'ui-overlay-root' ? overlayRoot : null)
        },
        overlayRoot
    };
}

describe('map boot guard', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('accepts a runtime-ready map without recording a failure', () => {
        const scene = {};

        const result = validateMapBootContract(scene, createRuntimeReadyMapData(), {
            mapName: 'map'
        });

        expect(result.success).toBe(true);
        expect(result.blockingIssues).toEqual([]);
        expect(result.message).toBe('Map boot contract passed for "map".');
        expect(scene.mapBootFailure).toBeUndefined();
    });

    it('records and renders a readable failure for an invalid map', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { documentRef, overlayRoot } = createFakeDocument();
        const scene = {};

        const result = validateMapBootContract(scene, { layers: [], tilesets: [] }, {
            mapName: 'vcf_map',
            documentRef
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Map boot failed: "vcf_map" does not satisfy the runtime map contract.');
        expect(result.message).toContain('Missing required runtime layer "floor".');
        expect(result.message).toContain('more issues hidden');
        expect(scene.mapBootFailure.message).toBe(result.message);
        expect(scene.mapBootFailure.blockingIssues.length).toBeGreaterThan(0);
        expect(overlayRoot.children).toHaveLength(1);
        expect(overlayRoot.children[0].attributes.role).toBe('alert');
        expect(overlayRoot.children[0].textContent).toBe(result.message);
        expect(errorSpy).toHaveBeenCalledWith(result.message);
    });

    it('fails gracefully when the map data is absent from cache', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const scene = {};

        const result = validateMapBootContract(scene, null, { mapName: 'missing_map' });

        expect(result.success).toBe(false);
        expect(result.blockingIssues).toEqual([]);
        expect(scene.mapBootFailure.message).toBe('Map boot failed: "missing_map" was not found in the loaded tilemap cache.');
        expect(errorSpy).toHaveBeenCalledWith(scene.mapBootFailure.message);
    });

    it('reads Phaser tilemap cache entries and JSON cache fallbacks', () => {
        const mapData = createRuntimeReadyMapData();
        const sceneWithTilemapCache = {
            cache: {
                tilemap: {
                    get: vi.fn(() => ({ data: mapData }))
                }
            }
        };
        const sceneWithJsonCache = {
            cache: {
                tilemap: {
                    get: vi.fn(() => null)
                },
                json: {
                    get: vi.fn(() => mapData)
                }
            }
        };

        expect(getCachedTilemapData(sceneWithTilemapCache, 'map')).toBe(mapData);
        expect(getCachedTilemapData(sceneWithJsonCache, 'map')).toBe(mapData);
    });

    it('validates the loaded cache entry by map key', () => {
        const mapData = createRuntimeReadyMapData();
        const scene = {
            cache: {
                tilemap: {
                    get: vi.fn(() => ({ data: mapData }))
                }
            }
        };

        const result = validateLoadedMapBootContract(scene, { mapKey: 'map' });

        expect(result.success).toBe(true);
        expect(scene.cache.tilemap.get).toHaveBeenCalledWith('map');
    });
});