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

            const firstItemButton = scene.uiManager.dialogManager.currentDialogParams?.buttons?.[0] ?? null;
            const itemName = firstItemButton?.label ?? null;

            if (!itemName) {
                throw new Error('Vendor inventory did not expose a selectable item.');
            }

            scene.questManager.activeQuests = [createMatchingQuest(itemName)];
            firstItemButton.onClick();

            return itemName;
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