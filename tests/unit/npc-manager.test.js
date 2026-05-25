import { describe, expect, it, vi } from 'vitest';

import NPCManager from '../../npcManager.js';

function createTextIndicator() {
    return {
        setOrigin: vi.fn(function () { return this; }),
        setDepth: vi.fn(function () { return this; }),
        destroy: vi.fn()
    };
}

describe('NPCManager interaction state', () => {
    it('creates grouped NPC sprites from spawn points and applies depth through the spawn path', () => {
        const group = { add: vi.fn() };
        const sprite = { id: 'npc-1' };
        const setNPCDepth = vi.spyOn(NPCManager, 'setNPCDepth').mockImplementation(() => {});
        const getRandomSpriteKey = vi.spyOn(NPCManager, 'getRandomSpriteKey').mockReturnValue('npc1');
        const scene = {
            map: {
                heightInPixels: 640,
                getObjectLayer: vi.fn(() => ({
                    objects: [
                        { type: 'point', x: 0, y: 50 },
                        { type: 'rect', x: 0, y: 0, width: 100, height: 100 }
                    ]
                }))
            },
            tablesLayer: { depth: 350 },
            add: {
                group: vi.fn(() => group),
                sprite: vi.fn(() => sprite)
            }
        };

        NPCManager.create(scene);

        expect(scene.add.group).toHaveBeenCalledTimes(1);
        expect(scene.add.sprite).toHaveBeenCalledWith(0, 50, 'npc1', 4);
        expect(group.add).toHaveBeenCalledWith(sprite);
        expect(setNPCDepth).toHaveBeenCalledWith(sprite, { type: 'rect', x: 0, y: 0, width: 100, height: 100 }, 350);
        expect(scene.npcGroup).toBe(group);

        getRandomSpriteKey.mockRestore();
        setNPCDepth.mockRestore();
    });

    it('marks nearby NPCs interactable and creates one exclamation indicator', () => {
        const indicator = createTextIndicator();
        const npc = {
            x: 120,
            y: 110,
            depth: 7,
            interactable: false,
            exclamation: null
        };
        const scene = {
            player: { x: 100, y: 100 },
            isDialogOpen: false,
            add: {
                text: vi.fn(() => indicator)
            },
            npcGroup: {
                getChildren: () => [npc]
            }
        };

        NPCManager.update(scene, 0, 16);

        expect(npc.interactable).toBe(true);
        expect(scene.add.text).toHaveBeenCalledWith(120, 78, '!', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#FF0000',
            stroke: '#FFFFFF',
            strokeThickness: 3,
            align: 'center'
        });
        expect(indicator.setOrigin).toHaveBeenCalledWith(0.5);
        expect(indicator.setDepth).toHaveBeenCalledWith(8);
        expect(npc.exclamation).toBe(indicator);
    });

    it('clears exclamation indicators when NPCs move out of range', () => {
        const destroy = vi.fn();
        const npc = {
            x: 300,
            y: 100,
            depth: 7,
            interactable: true,
            exclamation: { destroy }
        };
        const scene = {
            player: { x: 100, y: 100 },
            isDialogOpen: false,
            add: {
                text: vi.fn()
            },
            npcGroup: {
                getChildren: () => [npc]
            }
        };

        NPCManager.update(scene, 0, 16);

        expect(npc.interactable).toBe(false);
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(npc.exclamation).toBe(null);
        expect(scene.add.text).not.toHaveBeenCalled();
    });
});