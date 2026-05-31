import { createFestivalLog } from './festivalLog.js';

function requireScene(getScene) {
    const scene = getScene?.();

    if (!scene) {
        throw new Error('TileTest scene is not ready.');
    }

    if (!scene.testMode) {
        throw new Error('TileTest test API is only available in test mode.');
    }

    return scene;
}

function getVendorNpc(scene, index = 0) {
    const npc = scene.npcGroup?.getChildren?.()[index] ?? null;

    if (!npc) {
        throw new Error(`Vendor NPC ${index} is not available.`);
    }

    return npc;
}

function positionPlayerNearVendor(scene, index = 0, offsetY = 10) {
    const npc = getVendorNpc(scene, index);

    scene.player.setPosition(npc.x, npc.y + offsetY);
    scene.cameras.main.centerOn(scene.player.x, scene.player.y);
    scene.inputManager.clearMovementState();
    scene.vendorManager.update();

    return npc;
}

function getFlags(scene) {
    return {
        isDialogOpen: scene.uiManager.isDialogOpen,
        isHelpOpen: scene.uiManager.isHelpOpen,
        isInventoryOpen: scene.uiManager.isInventoryOpen,
        isQuestsOpen: scene.uiManager.isQuestsOpen
    };
}

function getDialogSnapshot(scene) {
    const dialogParams = scene.uiManager?.dialogManager?.currentDialogParams ?? {};

    return {
        title: dialogParams.title ?? null,
        text: dialogParams.text ?? null,
        textItems: dialogParams.textPagination?.text ?? null
    };
}

function getMovementSnapshot(scene) {
    return {
        direction: scene.inputManager.getDirection(),
        target: scene.inputManager.target,
        ignoringPointerUntilRelease: scene.inputManager.ignorePointerUntilRelease
    };
}

function getPlayerSnapshot(scene) {
    const body = scene.player?.body ?? null;

    return {
        x: scene.player?.x ?? null,
        y: scene.player?.y ?? null,
        bodyX: body?.x ?? null,
        bodyY: body?.y ?? null,
        width: body?.width ?? null,
        height: body?.height ?? null,
        velocityX: body?.velocity?.x ?? 0,
        velocityY: body?.velocity?.y ?? 0
    };
}

function getPlayerScreenPosition(scene) {
    return {
        x: scene.player.x - scene.cameras.main.scrollX,
        y: scene.player.y - scene.cameras.main.scrollY,
        gameWidth: scene.scale.width,
        gameHeight: scene.scale.height
    };
}

function getCollisionBody(scene, index = 0) {
    const collisionBody = scene.customCollisionBodies?.[index] ?? null;

    if (!collisionBody?.body) {
        throw new Error(`Collision body ${index} is not available.`);
    }

    return collisionBody;
}

function getCollisionBodySnapshot(collisionBody) {
    return {
        x: collisionBody.body.x,
        y: collisionBody.body.y,
        width: collisionBody.body.width,
        height: collisionBody.body.height,
        tileInfo: collisionBody.tileInfo ?? null
    };
}

function positionPlayerForCollisionProbe(scene, index = 0, gap = 64) {
    const collisionBody = getCollisionBody(scene, index);
    const playerBody = scene.player?.body ?? null;

    if (!playerBody) {
        throw new Error('Player body is not available.');
    }

    const bodyOffsetX = scene.player.x - playerBody.x;
    const bodyOffsetY = scene.player.y - playerBody.y;
    const targetBodyX = collisionBody.body.x - playerBody.width - gap;
    const targetBodyY = collisionBody.body.y + (collisionBody.body.height - playerBody.height) / 2;

    scene.player.setPosition(targetBodyX + bodyOffsetX, targetBodyY + bodyOffsetY);
    scene.cameras.main.centerOn(scene.player.x, scene.player.y);
    scene.inputManager.clearMovementState();
    scene.vendorManager.update();

    return {
        player: getPlayerSnapshot(scene),
        collision: getCollisionBodySnapshot(collisionBody)
    };
}

function getProgressSnapshot(scene) {
    return {
        inventoryCount: scene.uiManager.inventory.length,
        inventoryItemName: scene.uiManager.inventory[0]?.name ?? null,
        score: scene.uiManager.score,
        activeQuestCount: scene.questManager.activeQuests.length,
        completedQuestCount: scene.questManager.completedQuests.length
    };
}

function resetProgressionState(scene) {
    scene.uiManager.inventory = [];
    scene.uiManager.score = 0;
    scene.uiManager.scoreText?.setText?.('SCORE: 0');
    scene.questManager.activeQuests = [];
    scene.questManager.completedQuests = [];
}

function createMatchingQuest(itemName) {
    return {
        id: 'test-quest',
        type: 'collection',
        title: 'Collect A Test Item',
        description: 'Test quest for browser smoke validation',
        objectives: [{
            item: { name: itemName },
            collected: false,
            vendor: null
        }],
        reward: {
            points: 10,
            description: '10 points for the test quest'
        },
        created: Date.now(),
        completed: false
    };
}

function createDiscoveryQuest(vendors) {
    return {
        id: 'test-discovery-passport',
        type: 'discovery',
        title: 'Discovery Passport',
        description: 'Visit the fixture vendors and collect their clues.',
        objectives: vendors.map(vendor => ({
            vendorId: vendor.id,
            vendorName: vendor.name ?? vendor.id,
            booth: vendor.booth ?? 'Fixture Booth',
            clue: vendor.clueText ?? `Visit ${vendor.name ?? vendor.id} and ask about their exhibit.`,
            visited: false,
            visitedAt: null
        })),
        reward: {
            points: vendors.length * 15,
            description: `${vendors.length * 15} points for completing the discovery passport`
        },
        created: Date.now(),
        completed: false
    };
}

function getDiscoveryQuestSnapshot(scene) {
    const activeQuest = scene.questManager.activeQuests.find(quest => quest.type === 'discovery') ?? null;
    const completedQuest = scene.questManager.completedQuests.find(quest => quest.type === 'discovery') ?? null;
    const quest = activeQuest ?? completedQuest;

    return {
        active: Boolean(activeQuest),
        completed: Boolean(completedQuest),
        title: quest?.title ?? null,
        visitedCount: quest?.objectives?.filter(objective => objective.visited).length ?? 0,
        totalCount: quest?.objectives?.length ?? 0,
        objectives: quest?.objectives?.map(objective => ({
            vendorId: objective.vendorId,
            vendorName: objective.vendorName,
            booth: objective.booth,
            clue: objective.clue,
            visited: objective.visited
        })) ?? []
    };
}

function getFestivalLogSnapshot(scene) {
    return createFestivalLog({
        activeQuests: scene.questManager.activeQuests,
        completedQuests: scene.questManager.completedQuests,
        inventory: scene.uiManager.inventory,
        score: scene.uiManager.score
    });
}

export function createTestModeApi(getScene) {
    return {
        isReady() {
            const scene = getScene?.();

            return Boolean(
                scene?.player
                && scene?.uiManager
                && scene?.vendorManager
                && scene?.inputManager
                && scene?.questManager?.sessionId
                && scene?.interactionsEnabled
                && scene?.testMode
            );
        },

        getFlags() {
            return getFlags(requireScene(getScene));
        },

        getDialogSnapshot() {
            return getDialogSnapshot(requireScene(getScene));
        },

        getMovementSnapshot() {
            return getMovementSnapshot(requireScene(getScene));
        },

        getPlayerSnapshot() {
            return getPlayerSnapshot(requireScene(getScene));
        },

        getPlayerScreenPosition() {
            return getPlayerScreenPosition(requireScene(getScene));
        },

        getCollisionBodySnapshot(index = 0) {
            const scene = requireScene(getScene);

            return getCollisionBodySnapshot(getCollisionBody(scene, index));
        },

        positionPlayerForCollisionProbe(index = 0, gap = 64) {
            const scene = requireScene(getScene);

            return positionPlayerForCollisionProbe(scene, index, gap);
        },

        getProgressSnapshot() {
            return getProgressSnapshot(requireScene(getScene));
        },

        positionPlayerNearVendor(index = 0, offsetY = 10) {
            const scene = requireScene(getScene);
            const npc = positionPlayerNearVendor(scene, index, offsetY);

            return {
                x: npc.x,
                y: npc.y
            };
        },

        getVendorClickTarget(index = 0, offsetY = 10) {
            const scene = requireScene(getScene);
            const npc = positionPlayerNearVendor(scene, index, offsetY);

            return {
                x: npc.x - scene.cameras.main.scrollX,
                y: npc.y - scene.cameras.main.scrollY,
                gameWidth: scene.scale.width,
                gameHeight: scene.scale.height
            };
        },

        collectFirstVendorItemWithMatchingQuest(index = 0) {
            const scene = requireScene(getScene);
            const npc = positionPlayerNearVendor(scene, index);
            const vendorData = npc.vendorData;

            if (!vendorData) {
                throw new Error(`Vendor NPC ${index} is missing vendor data.`);
            }

            resetProgressionState(scene);
            scene.vendorManager.interactWithVendor(vendorData, npc);

            const inventoryAction = scene.uiManager.dialogManager.currentDialogParams?.buttons?.find(
                (button) => button.label === 'Show me your inventory'
            );

            if (!inventoryAction) {
                throw new Error('Vendor inventory action is not available.');
            }

            inventoryAction.onClick();

            const itemButtonList = scene.uiManager.dialogManager.currentDialogParams?.itemButtons
                ?? scene.uiManager.dialogManager.currentDialogParams?.buttons
                ?? [];
            const firstItemButton = itemButtonList[0] ?? null;
            const itemName = firstItemButton?.label ?? null;

            if (!itemName) {
                throw new Error('Vendor inventory did not expose a selectable item.');
            }

            scene.questManager.activeQuests = [createMatchingQuest(itemName)];
            firstItemButton.onClick();

            return itemName;
        },

        openFirstVendorItemsDialog(index = 0) {
            const scene = requireScene(getScene);
            const npc = positionPlayerNearVendor(scene, index);
            const vendorData = npc.vendorData;

            if (!vendorData) {
                throw new Error(`Vendor NPC ${index} is missing vendor data.`);
            }

            scene.vendorManager.interactWithVendor(vendorData, npc);

            const inventoryAction = scene.uiManager.dialogManager.currentDialogParams?.buttons?.find(
                (button) => button.label === 'Show me your inventory'
            );

            if (!inventoryAction) {
                throw new Error('Vendor inventory action is not available.');
            }

            inventoryAction.onClick();

            return getDialogSnapshot(scene);
        },

        seedDiscoveryPassportFixture(count = 2) {
            const scene = requireScene(getScene);
            const vendors = scene.npcGroup.getChildren()
                .slice(0, count)
                .map((npc, index) => {
                    if (!npc.vendorData) {
                        throw new Error(`Vendor NPC ${index} is missing vendor data.`);
                    }

                    return npc.vendorData;
                });

            resetProgressionState(scene);
            scene.questManager.activeQuests = [createDiscoveryQuest(vendors)];

            return getDiscoveryQuestSnapshot(scene);
        },

        getDiscoveryQuestSnapshot() {
            return getDiscoveryQuestSnapshot(requireScene(getScene));
        },

        getFestivalLogSnapshot() {
            return getFestivalLogSnapshot(requireScene(getScene));
        },

        openQuestDialog() {
            const scene = requireScene(getScene);

            scene.uiManager.showQuestDialog();

            return getDialogSnapshot(scene);
        },

        seedPanelFixtures() {
            const scene = requireScene(getScene);

            scene.uiManager.inventory = [{
                id: 'fixture-item',
                name: 'Fixture Item',
                description: 'Panel smoke item',
                value: 5
            }];
            scene.questManager.activeQuests = [{
                id: 'panel-quest',
                type: 'collection',
                title: 'Panel Quest',
                description: 'Quest panel smoke coverage',
                objectives: [{
                    item: { name: 'Fixture Item' },
                    collected: false,
                    vendor: null
                }],
                reward: {
                    points: 10,
                    description: '10 points'
                },
                created: Date.now(),
                completed: false
            }];
            scene.questManager.completedQuests = [];

            return true;
        },

        openHelpDialog() {
            const scene = requireScene(getScene);

            scene.uiManager.toggleHelp();

            return getFlags(scene);
        }
    };
}