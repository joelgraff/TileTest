import { afterEach, describe, expect, it, vi } from 'vitest';

import PlayerManager from '../../playerManager.js';

describe('PlayerManager movement ownership', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        PlayerManager.lastX = 0;
        PlayerManager.lastY = 0;
        PlayerManager.stuckCounter = 0;
    });

    it('resolves movement direction once per frame and reuses it across player runtime handlers', () => {
        const direction = { x: 1, y: -1 };
        const scene = {
            player: {},
            inputManager: {
                getDirection: vi.fn(() => direction)
            },
            gameState: {
                isDialogOpen: false
            }
        };
        const movementSpy = vi.spyOn(PlayerManager, 'handlePlayerMovement').mockImplementation(() => {});
        const animationSpy = vi.spyOn(PlayerManager, 'handlePlayerAnimation').mockImplementation(() => {});
        const depthSpy = vi.spyOn(PlayerManager, 'updatePlayerDepth').mockImplementation(() => {});
        const debugSpy = vi.spyOn(PlayerManager, 'drawPlayerDebug').mockImplementation(() => {});

        PlayerManager.update(scene, 0, 16);

        expect(scene.inputManager.getDirection).toHaveBeenCalledTimes(1);
        expect(movementSpy).toHaveBeenCalledWith(scene, direction);
        expect(animationSpy).toHaveBeenCalledWith(scene, direction);
        expect(depthSpy).toHaveBeenCalledWith(scene);
        expect(debugSpy).toHaveBeenCalledWith(scene, direction);
    });

    it('sets the initial player depth after creation', () => {
        const createPlayerSprite = vi.spyOn(PlayerManager, 'createPlayerSprite').mockReturnValue({});
        const setPlayerCollisionBox = vi.spyOn(PlayerManager, 'setPlayerCollisionBox').mockImplementation(() => {});
        const createPlayerAnimations = vi.spyOn(PlayerManager, 'createPlayerAnimations').mockImplementation(() => {});
        const updatePlayerDepth = vi.spyOn(PlayerManager, 'updatePlayerDepth').mockImplementation(() => {});
        const scene = {
            map: {
                getObjectLayer: vi.fn(() => ({
                    objects: [{ name: 'start', point: true, x: 12, y: 18 }]
                }))
            }
        };

        PlayerManager.create(scene);

        expect(createPlayerSprite).toHaveBeenCalledWith(scene, 12, 18);
        expect(setPlayerCollisionBox).toHaveBeenCalledWith(scene);
        expect(createPlayerAnimations).toHaveBeenCalledWith(scene);
        expect(updatePlayerDepth).toHaveBeenCalledWith(scene);

        createPlayerSprite.mockRestore();
        setPlayerCollisionBox.mockRestore();
        createPlayerAnimations.mockRestore();
        updatePlayerDepth.mockRestore();
    });

    it('loads the player spritesheet from the selected asset package during preload', () => {
        const scene = {
            assetPackageName: '24px',
            load: {
                spritesheet: vi.fn()
            }
        };

        PlayerManager.preload(scene, {
            frameWidth: 24,
            frameHeight: 36
        });

        expect(scene.playerSpriteConfig).toEqual({
            frameWidth: 24,
            frameHeight: 36
        });
        expect(scene.load.spritesheet).toHaveBeenCalledWith(
            'player',
            'assets/24px/player.png',
            { frameWidth: 24, frameHeight: 36 }
        );
    });

    it('uses runtime profile collision metadata when the map has no player tileset collision data', () => {
        const setSize = vi.fn();
        const setOffset = vi.fn();
        const scene = {
            player: {
                frame: { index: 0 },
                setSize,
                setOffset
            },
            map: {
                tilesets: [{ name: 'table tiles 24' }]
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
            }
        };

        PlayerManager.setPlayerCollisionBox(scene);

        expect(setSize).toHaveBeenCalledWith(20, 10);
        expect(setOffset).toHaveBeenCalledWith(2, 24);
    });

    it('resolves -1 runtime profile collision metadata to a full-size player collision box', () => {
        const setSize = vi.fn();
        const setOffset = vi.fn();
        const scene = {
            player: {
                frame: { index: 0 },
                setSize,
                setOffset
            },
            playerSpriteConfig: {
                frameWidth: 24,
                frameHeight: 36
            },
            map: {
                tilesets: [{ name: 'table tiles 24' }]
            },
            mapRuntimeProfile: {
                sprite: {
                    collision: {
                        left: -1,
                        top: -1,
                        width: -1,
                        height: -1
                    }
                }
            }
        };

        PlayerManager.setPlayerCollisionBox(scene);

        expect(setSize).toHaveBeenCalledWith(24, 36);
        expect(setOffset).toHaveBeenCalledWith(0, 0);
    });

    it('falls back to the configured default footbox when runtime collision metadata is missing', () => {
        const setSize = vi.fn();
        const setOffset = vi.fn();
        const scene = {
            player: {
                frame: { index: 0 },
                setSize,
                setOffset
            },
            map: {
                tilesets: [{ name: 'table tiles 24' }]
            },
            mapRuntimeProfile: {
                sprite: {
                    collision: {
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0
                    }
                }
            }
        };

        PlayerManager.setPlayerCollisionBox(scene);

        expect(setSize).toHaveBeenCalledWith(24, 10);
        expect(setOffset).toHaveBeenCalledWith(0, 30);
    });

    it('keeps the player above the tables layer while preserving y-order in the visible band', () => {
        const setDepth = vi.fn();
        const scene = {
            player: {
                y: 120,
                setDepth
            },
            map: {
                heightInPixels: 640
            },
            mapLayers: {
                tables: { depth: 426 },
                tabletops: { depth: 1280 }
            }
        };

        PlayerManager.updatePlayerDepth(scene);

        expect(setDepth).toHaveBeenCalledWith(427);
    });

    it('continues to sort the player by y once below the tables layer', () => {
        const setDepth = vi.fn();
        const scene = {
            player: {
                y: 500,
                setDepth
            },
            map: {
                heightInPixels: 640
            },
            mapLayers: {
                tables: { depth: 426 },
                tabletops: { depth: 1280 }
            }
        };

        PlayerManager.updatePlayerDepth(scene);

        expect(setDepth).toHaveBeenCalledWith(500);
    });

    it('still prefers player tileset collision objects when they are available', () => {
        const setSize = vi.fn();
        const setOffset = vi.fn();
        const scene = {
            player: {
                frame: { index: 0 },
                setSize,
                setOffset
            },
            map: {
                tilesets: [{
                    name: 'player',
                    tileData: {
                        0: {
                            objectgroup: {
                                objects: [{ x: 4, y: 30, width: 18, height: 8 }]
                            }
                        }
                    }
                }]
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
            }
        };

        PlayerManager.setPlayerCollisionBox(scene);

        expect(setSize).toHaveBeenCalledWith(18, 8);
        expect(setOffset).toHaveBeenCalledWith(4, 30);
    });

    it('cancels a stuck movement target through InputManager ownership', () => {
        const setVelocity = vi.fn();
        const cancelMovementTarget = vi.fn();
        const scene = {
            player: {
                x: 100,
                y: 120,
                setVelocity
            },
            inputManager: {
                getDirection: () => ({ x: 0, y: 0 }),
                hasMovementTarget: () => true,
                cancelMovementTarget
            }
        };

        PlayerManager.lastX = 100;
        PlayerManager.lastY = 120;
        PlayerManager.stuckCounter = 1;

        PlayerManager.handlePlayerMovement(scene);

        expect(cancelMovementTarget).toHaveBeenCalledTimes(1);
        expect(setVelocity).toHaveBeenCalledWith(0, 0);
        expect(PlayerManager.stuckCounter).toBe(0);
    });
});