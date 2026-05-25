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
    await page.waitForFunction(() => window.__tileTest?.testApi?.isReady?.());

    return { consoleErrors, pageErrors };
}

test('game boots and renders without startup runtime errors', async ({ page }) => {
    const { consoleErrors, pageErrors } = await gotoGame(page);

    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});

test('space opens a nearby vendor dialog without starting movement', async ({ page }) => {
    await gotoGame(page);

    await page.evaluate(() => window.__tileTest.testApi.positionPlayerNearVendor());

    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isDialogOpen);

    const state = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        movement: window.__tileTest.testApi.getMovementSnapshot()
    }));

    expect(state.flags.isDialogOpen).toBe(true);
    expect(state.movement.target).toBeNull();
});

test('clicking a nearby vendor opens dialog and suppresses click-to-move', async ({ page }) => {
    await gotoGame(page);

    const clickTarget = await page.evaluate(() => window.__tileTest.testApi.getVendorClickTarget());

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();

    const scaledX = (clickTarget.x / clickTarget.gameWidth) * box.width;
    const scaledY = (clickTarget.y / clickTarget.gameHeight) * box.height;

    await page.mouse.click(box.x + scaledX, box.y + scaledY);
    await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isDialogOpen);

    const state = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        movement: window.__tileTest.testApi.getMovementSnapshot()
    }));

    expect(state.flags.isDialogOpen).toBe(true);
    expect(state.movement.target).toBeNull();
    expect(state.movement.ignoringPointerUntilRelease).toBe(true);
});

test('collecting a vendor item updates inventory and completes a matching quest', async ({ page }) => {
    await gotoGame(page);

    const collectedItem = await page.evaluate(() => window.__tileTest.testApi.collectFirstVendorItemWithMatchingQuest());

    const state = await page.evaluate(() => {
        return {
            progress: window.__tileTest.testApi.getProgressSnapshot(),
            dialog: window.__tileTest.testApi.getDialogSnapshot()
        };
    });

    expect(state.progress.inventoryCount).toBe(1);
    expect(state.progress.inventoryItemName).toBe(collectedItem);
    expect(state.progress.score).toBeGreaterThan(10);
    expect(state.progress.activeQuestCount).toBe(0);
    expect(state.progress.completedQuestCount).toBe(1);
    expect(state.dialog.text).toContain('Quest progress updated');
});

test('help, inventory, and quest panels open and close cleanly', async ({ page }) => {
    await gotoGame(page);

    await page.evaluate(() => {
        window.__tileTest.testApi.seedPanelFixtures();
        window.__tileTest.testApi.openHelpDialog();
    });

    const helpState = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        dialog: window.__tileTest.testApi.getDialogSnapshot()
    }));

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    await page.keyboard.press('i');
    await page.waitForFunction(() => {
        const flags = window.__tileTest.testApi.getFlags();
        return flags.isInventoryOpen && flags.isDialogOpen;
    });

    const inventoryState = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        dialog: window.__tileTest.testApi.getDialogSnapshot(),
        movement: window.__tileTest.testApi.getMovementSnapshot()
    }));

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    await page.keyboard.press('q');
    await page.waitForFunction(() => {
        const flags = window.__tileTest.testApi.getFlags();
        return flags.isQuestsOpen && flags.isDialogOpen;
    });

    const questState = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        dialog: window.__tileTest.testApi.getDialogSnapshot()
    }));

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const finalState = await page.evaluate(() => ({
        finalFlags: window.__tileTest.testApi.getFlags()
    }));

    expect(helpState.dialog.title).toBe('Help');
    expect(helpState.dialog.text).toContain('Controls:');
    expect(helpState.flags.isDialogOpen).toBe(true);
    expect(helpState.flags.isHelpOpen).toBe(true);

    expect(inventoryState.dialog.title).toBe('Inventory');
    expect(inventoryState.dialog.text).toContain('Fixture Item');
    expect(inventoryState.flags.isDialogOpen).toBe(true);
    expect(inventoryState.flags.isInventoryOpen).toBe(true);
    expect(inventoryState.movement.direction).toEqual({ x: 0, y: 0 });

    expect(questState.dialog.title).toBe('Quests');
    expect(questState.dialog.textItems.some(item => item.includes('Panel Quest'))).toBe(true);
    expect(questState.flags.isDialogOpen).toBe(true);
    expect(questState.flags.isQuestsOpen).toBe(true);

    expect(finalState.finalFlags).toEqual({
        isDialogOpen: false,
        isHelpOpen: false,
        isInventoryOpen: false,
        isQuestsOpen: false
    });
});