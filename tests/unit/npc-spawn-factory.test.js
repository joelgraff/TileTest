import { describe, expect, it, vi } from 'vitest';

import { createNPCGroup, resolveNPCTablesLayerDepth } from '../../npcSpawnFactory.js';

describe('NPC spawn factory', () => {
    it('uses the tables layer depth when available and falls back to map height otherwise', () => {
        expect(resolveNPCTablesLayerDepth({
            mapLayers: {
                tables: { depth: 275 }
            },
            map: { heightInPixels: 640 }
        })).toBe(275);

        expect(resolveNPCTablesLayerDepth({
            mapLayers: {},
            map: { heightInPixels: 640.8 }
        })).toBe(640);
    });

    it('creates a group of NPC sprites using the injected spawn collaborators', () => {
        const group = { add: vi.fn() };
        const sprite = { id: 'npc-1' };
        const scene = {
            add: {
                group: vi.fn(() => group)
            },
            physics: {
                add: {
                    sprite: vi.fn(() => sprite)
                }
            }
        };
        const getNearestEdgeDirection = vi.fn(() => 'right');
        const getFrameForDirection = vi.fn(() => 8);
        const getRandomSpriteKey = vi.fn(() => 'npc2');
        const setNPCDepth = vi.fn();

        const result = createNPCGroup(scene, [{ x: 10, y: 20 }], { x: 0, y: 0, width: 100, height: 100 }, 300, {
            getNearestEdgeDirection,
            getFrameForDirection,
            getRandomSpriteKey,
            setNPCDepth
        });

        expect(result).toBe(group);
        expect(scene.add.group).toHaveBeenCalledTimes(1);
        expect(getNearestEdgeDirection).toHaveBeenCalledWith({ x: 10, y: 20 }, { x: 0, y: 0, width: 100, height: 100 });
        expect(getFrameForDirection).toHaveBeenCalledWith('right');
        expect(getRandomSpriteKey).toHaveBeenCalledTimes(1);
        expect(scene.physics.add.sprite).toHaveBeenCalledWith(10, 20, 'npc2', 8);
        expect(group.add).toHaveBeenCalledWith(sprite);
        expect(setNPCDepth).toHaveBeenCalledWith(sprite, { x: 0, y: 0, width: 100, height: 100 }, 300);
    });

    it('prefers resolved spawn facing and point-level area context when provided', () => {
        const group = { add: vi.fn() };
        const sprite = { id: 'npc-1' };
        const scene = {
            add: {
                group: vi.fn(() => group)
            },
            physics: {
                add: {
                    sprite: vi.fn(() => sprite)
                }
            }
        };
        const getNearestEdgeDirection = vi.fn(() => 'right');
        const getFrameForDirection = vi.fn(() => 12);
        const getRandomSpriteKey = vi.fn(() => 'npc_001');
        const setNPCDepth = vi.fn();
        const npcAreaRect = { x: 10, y: 20, width: 40, height: 50 };

        createNPCGroup(scene, [{ x: 24, y: 48, resolvedFacing: 'up', npcAreaRect }], null, 300, {
            getNearestEdgeDirection,
            getFrameForDirection,
            getRandomSpriteKey,
            setNPCDepth
        });

        expect(getNearestEdgeDirection).not.toHaveBeenCalled();
        expect(getFrameForDirection).toHaveBeenCalledWith('up');
        expect(scene.physics.add.sprite).toHaveBeenCalledWith(24, 48, 'npc_001', 12);
        expect(setNPCDepth).toHaveBeenCalledWith(sprite, npcAreaRect, 300);
    });
});