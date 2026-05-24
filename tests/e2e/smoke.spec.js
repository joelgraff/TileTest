import { expect, test } from '@playwright/test';

async function gotoGame(page) {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });

    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    await page.goto('/?test=1', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Tilemap Game/);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => {
        return Boolean(
            window.__tileTest?.scene?.player &&
            window.__tileTest?.scene?.uiManager &&
            window.__tileTest?.scene?.vendorManager &&
            window.__tileTest?.scene?.inputManager &&
            window.__tileTest?.scene?.questManager?.sessionId &&
            window.__tileTest?.scene?.interactionsEnabled &&
            window.__tileTest?.scene?.testMode
        );
    });

    return { consoleErrors, pageErrors };
}

test('game boots and renders without startup runtime errors', async ({ page }) => {
    const { consoleErrors, pageErrors } = await gotoGame(page);

    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});

test('space opens a nearby vendor dialog without starting movement', async ({ page }) => {
    await gotoGame(page);

    await page.evaluate(() => {
        const scene = window.__tileTest.scene;
        const npc = scene.npcGroup.getChildren()[0];

        scene.player.setPosition(npc.x, npc.y + 10);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.inputManager.clearMovementState();
        scene.vendorManager.update();
    });

    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__tileTest.scene.uiManager.isDialogOpen);

    const state = await page.evaluate(() => ({
        isDialogOpen: window.__tileTest.scene.uiManager.isDialogOpen,
        movementTarget: window.__tileTest.scene.inputManager.target
    }));

    expect(state.isDialogOpen).toBe(true);
    expect(state.movementTarget).toBeNull();
});

test('clicking a nearby vendor opens dialog and suppresses click-to-move', async ({ page }) => {
    await gotoGame(page);

    const clickTarget = await page.evaluate(() => {
        const scene = window.__tileTest.scene;
        const npc = scene.npcGroup.getChildren()[0];

        scene.player.setPosition(npc.x, npc.y + 10);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.inputManager.clearMovementState();
        scene.vendorManager.update();

        return {
            x: npc.x - scene.cameras.main.scrollX,
            y: npc.y - scene.cameras.main.scrollY,
            gameWidth: scene.scale.width,
            gameHeight: scene.scale.height
        };
    });

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    const scaledX = (clickTarget.x / clickTarget.gameWidth) * box.width;
    const scaledY = (clickTarget.y / clickTarget.gameHeight) * box.height;

    await page.mouse.click(box.x + scaledX, box.y + scaledY);
    await page.waitForFunction(() => window.__tileTest.scene.uiManager.isDialogOpen);

    const state = await page.evaluate(() => ({
        isDialogOpen: window.__tileTest.scene.uiManager.isDialogOpen,
        movementTarget: window.__tileTest.scene.inputManager.target,
        ignoringPointerUntilRelease: window.__tileTest.scene.inputManager.ignorePointerUntilRelease
    }));

    expect(state.isDialogOpen).toBe(true);
    expect(state.movementTarget).toBeNull();
    expect(state.ignoringPointerUntilRelease).toBe(true);
});

test('collecting a vendor item updates inventory and completes a matching quest', async ({ page }) => {
    await gotoGame(page);

    const collectedItem = await page.evaluate(() => {
        const scene = window.__tileTest.scene;
        const npc = scene.npcGroup.getChildren()[0];
        const vendorData = npc.vendorData;

        scene.player.setPosition(npc.x, npc.y + 10);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.inputManager.clearMovementState();
        scene.vendorManager.update();

        scene.uiManager.inventory = [];
        scene.uiManager.score = 0;
        scene.uiManager.scoreText.setText('SCORE: 0');
        scene.questManager.activeQuests = [];
        scene.questManager.completedQuests = [];

        scene.vendorManager.interactWithVendor(vendorData, npc);
        const inventoryAction = scene.uiManager.dialogManager.currentDialogParams.buttons.find(button => button.label === 'Show me your inventory');
        inventoryAction.onClick();

        const firstItemButton = scene.uiManager.dialogManager.currentDialogParams.buttons[0];
        const itemName = firstItemButton.label;

        scene.questManager.activeQuests = [{
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
        }];

        firstItemButton.onClick();

        return itemName;
    });

    const state = await page.evaluate(() => {
        const scene = window.__tileTest.scene;

        return {
            inventoryCount: scene.uiManager.inventory.length,
            inventoryItemName: scene.uiManager.inventory[0]?.name ?? null,
            score: scene.uiManager.score,
            activeQuestCount: scene.questManager.activeQuests.length,
            completedQuestCount: scene.questManager.completedQuests.length,
            dialogText: scene.uiManager.dialogManager.currentDialogParams.text
        };
    });

    expect(state.inventoryCount).toBe(1);
    expect(state.inventoryItemName).toBe(collectedItem);
    expect(state.score).toBeGreaterThan(10);
    expect(state.activeQuestCount).toBe(0);
    expect(state.completedQuestCount).toBe(1);
    expect(state.dialogText).toContain('Quest progress updated');
});

test('help, inventory, and quest panels open and close cleanly', async ({ page }) => {
    await gotoGame(page);

    const state = await page.evaluate(() => {
        const scene = window.__tileTest.scene;

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

        scene.uiManager.toggleHelp();
        const helpState = {
            title: scene.uiManager.dialogManager.currentDialogParams.title,
            text: scene.uiManager.dialogManager.currentDialogParams.text,
            isDialogOpen: scene.uiManager.isDialogOpen,
            isHelpOpen: scene.uiManager.isHelpOpen
        };
        scene.uiManager.handleInput('ESCAPE');

        scene.uiManager.handleInput('I');
        const inventoryState = {
            title: scene.uiManager.dialogManager.currentDialogParams.title,
            text: scene.uiManager.dialogManager.currentDialogParams.text,
            isDialogOpen: scene.uiManager.isDialogOpen,
            isInventoryOpen: scene.uiManager.isInventoryOpen,
            movement: scene.inputManager.getDirection()
        };
        scene.uiManager.handleInput('ESCAPE');

        scene.uiManager.handleInput('Q');
        const questState = {
            title: scene.uiManager.dialogManager.currentDialogParams.title,
            textItems: scene.uiManager.dialogManager.currentDialogParams.textPagination.text,
            isDialogOpen: scene.uiManager.isDialogOpen,
            isQuestsOpen: scene.uiManager.isQuestsOpen
        };
        scene.uiManager.handleInput('ESCAPE');

        return {
            helpState,
            inventoryState,
            questState,
            finalFlags: {
                isDialogOpen: scene.uiManager.isDialogOpen,
                isHelpOpen: scene.uiManager.isHelpOpen,
                isInventoryOpen: scene.uiManager.isInventoryOpen,
                isQuestsOpen: scene.uiManager.isQuestsOpen
            }
        };
    });

    expect(state.helpState.title).toBe('Help');
    expect(state.helpState.text).toContain('Controls:');
    expect(state.helpState.isDialogOpen).toBe(true);
    expect(state.helpState.isHelpOpen).toBe(true);

    expect(state.inventoryState.title).toBe('Inventory');
    expect(state.inventoryState.text).toContain('Fixture Item');
    expect(state.inventoryState.isDialogOpen).toBe(true);
    expect(state.inventoryState.isInventoryOpen).toBe(true);
    expect(state.inventoryState.movement).toEqual({ x: 0, y: 0 });

    expect(state.questState.title).toBe('Quests');
    expect(state.questState.textItems.some(item => item.includes('Panel Quest'))).toBe(true);
    expect(state.questState.isDialogOpen).toBe(true);
    expect(state.questState.isQuestsOpen).toBe(true);

    expect(state.finalFlags).toEqual({
        isDialogOpen: false,
        isHelpOpen: false,
        isInventoryOpen: false,
        isQuestsOpen: false
    });
});