import { describe, expect, it, vi } from 'vitest';

import { createTestModeApi } from '../../testModeApi.js';

function createScene() {
    const npc = {
        x: 120,
        y: 140,
        vendorData: { id: 'vendor-1', name: 'Vendor One', booth: 'A1', clueText: 'Find booth A1.' }
    };
    const secondNpc = {
        x: 180,
        y: 210,
        vendorData: { id: 'vendor-2', name: 'Vendor Two', booth: 'B2' }
    };
    const scene = {
        testMode: true,
        interactionsEnabled: true,
        player: {
            x: 0,
            y: 0,
            body: {
                x: -8,
                y: -12,
                width: 16,
                height: 24,
                velocity: {
                    x: 0,
                    y: 0
                }
            },
            setPosition(x, y) {
                this.x = x;
                this.y = y;
                this.body.x = x - 8;
                this.body.y = y - 12;
            }
        },
        cameras: {
            main: {
                scrollX: 10,
                scrollY: 20,
                centerOn: vi.fn()
            }
        },
        scale: {
            width: 960,
            height: 640
        },
        inputManager: {
            clearMovementState: vi.fn(),
            getDirection: vi.fn(() => ({ x: 0, y: 0 })),
            target: null,
            ignorePointerUntilRelease: false
        },
        vendorManager: {
            update: vi.fn(),
            interactWithVendor: vi.fn(() => {
                scene.uiManager.dialogManager.currentDialogParams = {
                    buttons: [{
                        label: 'Show me your inventory',
                        onClick: () => {
                            scene.uiManager.dialogManager.currentDialogParams = {
                                    itemButtons: [{
                                        label: 'Fixture Item',
                                        onClick: () => {
                                            scene.uiManager.inventory = [{ name: 'Fixture Item' }];
                                            scene.uiManager.score = 15;
                                            scene.questManager.activeQuests = [];
                                            scene.questManager.completedQuests = [{ id: 'test-quest' }];
                                            scene.uiManager.dialogManager.currentDialogParams = {
                                                text: 'Quest progress updated'
                                            };
                                        }
                                    }],
                                buttons: [{
                                    label: 'Fixture Item',
                                    onClick: () => {
                                        scene.uiManager.inventory = [{ name: 'Fixture Item' }];
                                        scene.uiManager.score = 15;
                                        scene.questManager.activeQuests = [];
                                        scene.questManager.completedQuests = [{ id: 'test-quest' }];
                                        scene.uiManager.dialogManager.currentDialogParams = {
                                            text: 'Quest progress updated'
                                        };
                                    }
                                }]
                            };
                        }
                    }]
                };
            })
        },
        questManager: {
            sessionId: 'test_session',
            activeQuests: [],
            completedQuests: []
        },
        uiManager: {
            isDialogOpen: false,
            isHelpOpen: false,
            isInventoryOpen: false,
            isQuestsOpen: false,
            inventory: [],
            score: 0,
            scoreText: {
                setText: vi.fn()
            },
            showQuestDialog: vi.fn(() => {
                scene.uiManager.dialogManager.currentDialogParams = {
                    title: 'Quests',
                    text: ['Discovery Passport', 'Progress: 0/2 vendors visited'],
                    textPagination: {
                        text: ['Discovery Passport', 'Progress: 0/2 vendors visited']
                    }
                };
            }),
            toggleHelp: vi.fn(() => {
                scene.uiManager.isDialogOpen = true;
                scene.uiManager.isHelpOpen = true;
                scene.uiManager.dialogManager.currentDialogParams = {
                    title: 'Help',
                    text: 'Controls:'
                };
            }),
            dialogManager: {
                currentDialogParams: {}
            }
        },
        npcGroup: {
            getChildren: () => [npc, secondNpc]
        },
        customCollisionBodies: [{
            body: {
                x: 220,
                y: 180,
                width: 32,
                height: 32
            },
            tileInfo: {
                id: 7,
                x: 10,
                y: 8
            }
        }]
    };

    return scene;
}

describe('test mode api', () => {
    it('reports readiness and exposes stable setup and snapshot helpers', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        expect(api.isReady()).toBe(true);
        expect(api.getFlags()).toEqual({
            isDialogOpen: false,
            isHelpOpen: false,
            isInventoryOpen: false,
            isQuestsOpen: false
        });

        const target = api.getVendorClickTarget();

        expect(target).toEqual({
            x: 110,
            y: 120,
            gameWidth: 960,
            gameHeight: 640
        });
        expect(api.getPlayerSnapshot()).toEqual({
            x: 120,
            y: 150,
            bodyX: 112,
            bodyY: 138,
            width: 16,
            height: 24,
            velocityX: 0,
            velocityY: 0
        });
        expect(api.getPlayerScreenPosition()).toEqual({
            x: 110,
            y: 130,
            gameWidth: 960,
            gameHeight: 640
        });
        expect(scene.player.x).toBe(120);
        expect(scene.player.y).toBe(150);
        expect(scene.inputManager.clearMovementState).toHaveBeenCalledTimes(1);
        expect(scene.vendorManager.update).toHaveBeenCalledTimes(1);
    });

    it('supports deterministic collision probe setup snapshots', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        const probe = api.positionPlayerForCollisionProbe(0, 20);

        expect(probe.collision).toEqual({
            x: 220,
            y: 180,
            width: 32,
            height: 32,
            tileInfo: {
                id: 7,
                x: 10,
                y: 8
            }
        });
        expect(probe.player).toEqual({
            x: 192,
            y: 196,
            bodyX: 184,
            bodyY: 184,
            width: 16,
            height: 24,
            velocityX: 0,
            velocityY: 0
        });
        expect(api.getCollisionBodySnapshot()).toEqual(probe.collision);
        expect(scene.cameras.main.centerOn).toHaveBeenCalledWith(192, 196);
        expect(scene.inputManager.clearMovementState).toHaveBeenCalledTimes(1);
        expect(scene.vendorManager.update).toHaveBeenCalledTimes(1);
    });

    it('supports high-level smoke setup for collection and panel flows', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        const itemName = api.collectFirstVendorItemWithMatchingQuest();

        expect(itemName).toBe('Fixture Item');
        expect(api.getProgressSnapshot()).toEqual({
            inventoryCount: 1,
            inventoryItemName: 'Fixture Item',
            score: 15,
            activeQuestCount: 0,
            completedQuestCount: 1
        });
        expect(api.getDialogSnapshot()).toEqual({
            title: null,
            text: 'Quest progress updated',
            textItems: null
        });

        api.seedPanelFixtures();
        api.openHelpDialog();

        expect(api.getProgressSnapshot()).toEqual({
            inventoryCount: 1,
            inventoryItemName: 'Fixture Item',
            score: 15,
            activeQuestCount: 1,
            completedQuestCount: 0
        });
        expect(api.getFlags()).toEqual({
            isDialogOpen: true,
            isHelpOpen: true,
            isInventoryOpen: false,
            isQuestsOpen: false
        });
        expect(api.getDialogSnapshot()).toEqual({
            title: 'Help',
            text: 'Controls:',
            textItems: null
        });
    });

    it('opens the vendor item dialog for layout validation', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        const dialog = api.openFirstVendorItemsDialog();

        expect(dialog.title).toBe(null);
        expect(dialog.text).toBe(null);
        expect(scene.uiManager.dialogManager.currentDialogParams.itemButtons).toBeDefined();
        expect(scene.uiManager.dialogManager.currentDialogParams.itemButtons).toHaveLength(1);
    });

    it('seeds discovery passport fixtures and exposes quest dialog snapshots', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        const seeded = api.seedDiscoveryPassportFixture();

        expect(seeded).toMatchObject({
            active: true,
            completed: false,
            title: 'Discovery Passport',
            visitedCount: 0,
            totalCount: 2
        });
        expect(seeded.objectives.map(objective => objective.vendorId)).toEqual(['vendor-1', 'vendor-2']);
        expect(seeded.objectives[0].clue).toBe('Find booth A1.');

        const dialog = api.openQuestDialog();

        expect(scene.uiManager.showQuestDialog).toHaveBeenCalledTimes(1);
        expect(dialog.title).toBe('Quests');
        expect(dialog.textItems).toContain('Progress: 0/2 vendors visited');
    });

    it('exposes festival log snapshots from session state', () => {
        const scene = createScene();
        const api = createTestModeApi(() => scene);

        scene.uiManager.score = 30;
        scene.uiManager.inventory = [{ id: 'item-1', name: 'Fixture Item', value: 5 }];
        scene.questManager.completedQuests = [{
            id: 'discovery-1',
            type: 'discovery',
            title: 'Discovery Passport',
            completed: true,
            objectives: [{
                vendorId: 'vendor-1',
                vendorName: 'Vendor One',
                booth: 'A1',
                clue: 'Find booth A1.',
                visited: true
            }],
            reward: {
                points: 30,
                description: '30 points'
            }
        }];

        const log = api.getFestivalLogSnapshot();

        expect(log).toMatchObject({
            score: 30,
            completedTrailCount: 1,
            stampCount: 1,
            collectedItemCount: 1,
            rewardPoints: 30
        });
        expect(log.stamps[0]).toMatchObject({
            vendorId: 'vendor-1',
            vendorName: 'Vendor One',
            clue: 'Find booth A1.',
            trailTitle: 'Discovery Passport'
        });
    });
});