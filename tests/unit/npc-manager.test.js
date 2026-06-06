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
    it('loads npc spritesheets from the selected asset package during preload', () => {
        const scene = {
            assetPackageName: '24px',
            load: {
                spritesheet: vi.fn()
            }
        };

        NPCManager.preload(scene, {
            spriteKeys: ['npc_001', 'npc_002'],
            frameWidth: 24,
            frameHeight: 36
        });

        expect(scene.npcSpriteConfig).toEqual({
            frameWidth: 24,
            frameHeight: 36,
            spriteKeys: ['npc_001', 'npc_002']
        });
        expect(scene.load.spritesheet).toHaveBeenNthCalledWith(
            1,
            'npc_001',
            'assets/24px/npc_001.png',
            { frameWidth: 24, frameHeight: 36 }
        );
        expect(scene.load.spritesheet).toHaveBeenNthCalledWith(
            2,
            'npc_002',
            'assets/24px/npc_002.png',
            { frameWidth: 24, frameHeight: 36 }
        );
    });

    it('chooses random npc textures from the scene preload configuration when available', () => {
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.75);

        const spriteKey = NPCManager.getRandomSpriteKey({
            npcSpriteConfig: {
                spriteKeys: ['npc_001', 'npc_002', 'npc_003', 'npc_004']
            }
        });

        expect(spriteKey).toBe('npc_004');

        randomSpy.mockRestore();
    });

    it('creates grouped NPC sprites from spawn points and applies depth through the spawn path', () => {
        const groupChildren = [];
        const group = {
            add: vi.fn(sprite => groupChildren.push(sprite)),
            getChildren: vi.fn(() => groupChildren)
        };
        const sprite = {
            id: 'npc-1',
            setSize: vi.fn(function () { return this; }),
            setOffset: vi.fn(function () { return this; }),
            setCollideWorldBounds: vi.fn(function () { return this; })
        };
        const setNPCDepth = vi.spyOn(NPCManager, 'setNPCDepth').mockImplementation(() => {});
        const getRandomSpriteKey = vi.spyOn(NPCManager, 'getRandomSpriteKey').mockReturnValue('npc1');
        const scene = {
            map: {
                heightInPixels: 640,
                tilesets: [{ name: 'table tiles 24' }],
                getObjectLayer: vi.fn(() => ({
                    objects: [
                        { type: 'point', x: 0, y: 50 },
                        { type: 'rect', x: 0, y: 0, width: 100, height: 100 }
                    ]
                }))
            },
            mapRuntimeProfile: {
                sprite: {
                    collision: {
                        left: 2,
                        top: 24,
                        width: 20,
                        height: 10
                    }
                }
            },
            physics: {
                add: {
                    sprite: vi.fn(() => sprite)
                }
            },
            mapLayers: {
                tables: { depth: 350 }
            },
            add: {
                group: vi.fn(() => group)
            }
        };

        NPCManager.create(scene);

        expect(scene.add.group).toHaveBeenCalledTimes(1);
        expect(scene.physics.add.sprite).toHaveBeenCalledWith(0, 50, 'npc1', 4);
        expect(group.add).toHaveBeenCalledWith(sprite);
        expect(sprite.setSize).toHaveBeenCalledWith(20, 10);
        expect(sprite.setOffset).toHaveBeenCalledWith(2, 24);
        expect(sprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
        expect(setNPCDepth).toHaveBeenCalledWith(sprite, { type: 'rect', x: 0, y: 0, width: 100, height: 100 }, 350);
        expect(scene.npcGroup).toBe(group);

        getRandomSpriteKey.mockRestore();
        setNPCDepth.mockRestore();
    });

    it('creates NPC sprites from grouped runtime-profile spawn areas without requiring a rect', () => {
        const groupChildren = [];
        const group = {
            add: vi.fn(sprite => groupChildren.push(sprite)),
            getChildren: vi.fn(() => groupChildren)
        };
        const sprite = {
            id: 'npc-1',
            setSize: vi.fn(function () { return this; }),
            setOffset: vi.fn(function () { return this; }),
            setCollideWorldBounds: vi.fn(function () { return this; })
        };
        const setNPCDepth = vi.spyOn(NPCManager, 'setNPCDepth').mockImplementation(() => {});
        const getRandomSpriteKey = vi.spyOn(NPCManager, 'getRandomSpriteKey').mockReturnValue('npc_001');
        const scene = {
            mapRuntimeProfile: {
                npcAreaLayers: [
                    {
                        spawnPoints: [
                            { x: 120, y: 180, resolvedFacing: 'up' },
                            { x: 144, y: 192, resolvedFacing: 'left' }
                        ],
                        layer: {
                            objects: []
                        }
                    }
                ]
            },
            map: {
                heightInPixels: 640,
                tilesets: [{ name: 'table tiles 24' }]
            },
            mapLayers: {
                tables: { depth: 350 }
            },
            physics: {
                add: {
                    sprite: vi.fn(() => sprite)
                }
            },
            add: {
                group: vi.fn(() => group)
            }
        };

        NPCManager.create(scene);

        expect(scene.add.group).toHaveBeenCalledTimes(1);
        expect(scene.physics.add.sprite).toHaveBeenNthCalledWith(1, 120, 180, 'npc_001', 12);
        expect(scene.physics.add.sprite).toHaveBeenNthCalledWith(2, 144, 192, 'npc_001', 4);
        expect(group.add).toHaveBeenCalledTimes(2);
        expect(sprite.setSize).toHaveBeenCalledWith(24, 10);
        expect(sprite.setOffset).toHaveBeenCalledWith(0, 30);
        expect(sprite.setCollideWorldBounds).toHaveBeenCalledWith(true);
        expect(setNPCDepth).toHaveBeenNthCalledWith(1, sprite, null, 350);
        expect(setNPCDepth).toHaveBeenNthCalledWith(2, sprite, null, 350);
        expect(scene.npcGroup).toBe(group);

        getRandomSpriteKey.mockRestore();
        setNPCDepth.mockRestore();
    });

    it('reuses the cached active NPC list when the player stays in the same tile cell', () => {
        const getChildren = vi.fn(() => [{ id: 'npc-1' }]);
        const activeNpcSprites = [{ id: 'npc-1', x: 24, y: 24 }];
        const scene = {
            player: { x: 24, y: 24 },
            map: {
                tileWidth: 24,
                tileHeight: 24
            },
            npcGroup: {
                getChildren
            },
            npcActivityPrimed: true,
            npcActivityCellKey: '1,1',
            activeNpcSprites,
            gameState: {
                isDialogOpen: true
            }
        };

        NPCManager.update(scene, 0, 16);

        expect(scene.activeNpcSprites).toBe(activeNpcSprites);
        expect(getChildren).not.toHaveBeenCalled();
    });

    it('sleeps distant NPCs and wakes nearby NPCs using tile-distance thresholds', () => {
        const sleepingExclamationDestroy = vi.fn();
        const awakeNpc = {
            x: 20,
            y: 20,
            body: {
                enable: true,
                stop: vi.fn(),
                updateFromGameObject: vi.fn()
            },
            setVelocity: vi.fn(),
            glowGraphic: {
                setVisible: vi.fn()
            },
            exclamation: {
                destroy: vi.fn()
            }
        };
        const sleepingNpc = {
            x: 400,
            y: 400,
            body: {
                enable: true,
                stop: vi.fn(),
                updateFromGameObject: vi.fn()
            },
            setVelocity: vi.fn(),
            glowGraphic: {
                setVisible: vi.fn()
            },
            exclamation: {
                destroy: sleepingExclamationDestroy
            }
        };
        const scene = {
            player: { x: 24, y: 24 },
            map: {
                tileWidth: 24,
                tileHeight: 24
            },
            npcActivityPrimed: false,
            npcGroup: {
                getChildren: () => [awakeNpc, sleepingNpc]
            }
        };

        const activeNpcSprites = NPCManager.refreshNPCActivity(scene);

        expect(activeNpcSprites).toEqual([awakeNpc]);
        expect(awakeNpc.body.enable).toBe(true);
        expect(awakeNpc.body.updateFromGameObject).toHaveBeenCalledTimes(1);
        expect(sleepingNpc.body.enable).toBe(false);
        expect(sleepingNpc.body.stop).toHaveBeenCalledTimes(1);
        expect(sleepingNpc.setVelocity).toHaveBeenCalledWith(0, 0);
        expect(sleepingNpc.glowGraphic.setVisible).toHaveBeenCalledWith(false);
        expect(sleepingExclamationDestroy).toHaveBeenCalledTimes(1);
        expect(scene.activeNpcSprites).toBe(activeNpcSprites);
    });

    it('falls back to y-based depth when no npc area rect is available', () => {
        const npc = {
            y: 128,
            setDepth: vi.fn()
        };

        NPCManager.setNPCDepth(npc, null, 100);

        expect(npc.setDepth).toHaveBeenCalledWith(128);
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
            gameState: {
                isDialogOpen: false
            },
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
            gameState: {
                isDialogOpen: false
            },
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