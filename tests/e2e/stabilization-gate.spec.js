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

    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
}

async function getPlayerSnapshot(page) {
    return page.evaluate(() => window.__tileTest.testApi.getPlayerSnapshot());
}

async function getPlayerScreenPosition(page) {
    return page.evaluate(() => window.__tileTest.testApi.getPlayerScreenPosition());
}

async function moveWithKeyboard(page, key) {
    const before = await getPlayerSnapshot(page);

    await page.keyboard.down(key);
    await page.waitForFunction(
        ({ startX, startY }) => {
            const player = window.__tileTest.testApi.getPlayerSnapshot();
            return Math.abs(player.x - startX) > 8 || Math.abs(player.y - startY) > 8;
        },
        { startX: before.x, startY: before.y }
    );
    await page.keyboard.up(key);

    const after = await getPlayerSnapshot(page);

    expect(Math.abs(after.x - before.x) > 8 || Math.abs(after.y - before.y) > 8).toBe(true);
}

async function moveWithPointer(page, isTouch = false) {
    const before = await getPlayerSnapshot(page);
    const playerScreen = await getPlayerScreenPosition(page);
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const x = box.x + ((playerScreen.x + 80) / playerScreen.gameWidth) * box.width;
    const y = box.y + (playerScreen.y / playerScreen.gameHeight) * box.height;

    if (isTouch) {
        await page.touchscreen.tap(x, y);
    } else {
        await page.mouse.click(x, y);
    }

    await page.waitForFunction(
        ({ startX, startY }) => {
            const player = window.__tileTest.testApi.getPlayerSnapshot();
            return Math.abs(player.x - startX) > 8 || Math.abs(player.y - startY) > 8;
        },
        { startX: before.x, startY: before.y }
    );

    const after = await getPlayerSnapshot(page);

    expect(Math.abs(after.x - before.x) > 8 || Math.abs(after.y - before.y) > 8).toBe(true);
}

async function verifyCollisionBoundary(page) {
    const probe = await page.evaluate(() => window.__tileTest.testApi.positionPlayerForCollisionProbe(0, 24));

    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(
        (collisionLeft) => {
            const player = window.__tileTest.testApi.getPlayerSnapshot();
            return player.bodyX + player.width >= collisionLeft - 2;
        },
        probe.collision.x
    );
    await page.waitForTimeout(150);
    await page.keyboard.up('ArrowRight');

    const after = await getPlayerSnapshot(page);

    expect(after.bodyX + after.width).toBeLessThanOrEqual(probe.collision.x + 2);
    expect(after.x).toBeGreaterThan(probe.player.x);
}

async function runChecklist(page, { isTouch = false } = {}) {
    await gotoGame(page);

    await page.evaluate(() => {
        window.__tileTest.testApi.seedPanelFixtures();
    });

    await page.evaluate(() => {
        window.__tileTest.testApi.positionPlayerForCollisionProbe(0, 80);
    });

    await moveWithKeyboard(page, 'ArrowRight');
    await moveWithPointer(page, isTouch);

    const dialogSurface = page.locator('#ui-overlay-root [data-dialog-surface="dom"]');

    await page.locator('[data-hud-control="help"]').click();
    await expect(dialogSurface).toContainText('Help');
    await page.keyboard.press('Escape');
    await expect(dialogSurface).toHaveCount(0);

    await page.locator('[data-hud-control="quests"]').click();
    await expect(dialogSurface).toContainText('Quests');
    await page.keyboard.press('Escape');
    await expect(dialogSurface).toHaveCount(0);

    await page.locator('[data-hud-control="inventory"]').click();
    await expect(dialogSurface).toContainText('Inventory');
    await page.keyboard.press('Escape');
    await expect(dialogSurface).toHaveCount(0);

    await page.evaluate(() => {
        window.__tileTest.testApi.positionPlayerNearVendor();
    });
    await page.keyboard.press('Space');
    await expect(dialogSurface).toBeVisible();

    const vendorState = await page.evaluate(() => ({
        flags: window.__tileTest.testApi.getFlags(),
        dialog: window.__tileTest.testApi.getDialogSnapshot(),
        movement: window.__tileTest.testApi.getMovementSnapshot()
    }));

    expect(vendorState.flags.isDialogOpen).toBe(true);
    expect(vendorState.movement.target).toBeNull();
    await expect(dialogSurface.locator('.dom-dialog-image')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const collectedItem = await page.evaluate(() => window.__tileTest.testApi.collectFirstVendorItemWithMatchingQuest());
    const progress = await page.evaluate(() => window.__tileTest.testApi.getProgressSnapshot());
    const completionDialog = await page.evaluate(() => window.__tileTest.testApi.getDialogSnapshot());

    expect(collectedItem).toBeTruthy();
    expect(progress.inventoryCount).toBe(1);
    expect(progress.inventoryItemName).toBe(collectedItem);
    expect(progress.activeQuestCount).toBe(0);
    expect(progress.completedQuestCount).toBe(1);
    expect(progress.score).toBeGreaterThan(10);
    expect(completionDialog.text).toContain('Quest progress updated');
    await expect(page.locator('[data-hud-score]')).toContainText(`SCORE: ${progress.score}`);

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const movementAfterClose = await page.evaluate(() => window.__tileTest.testApi.getMovementSnapshot());

    expect(movementAfterClose.target).toBeNull();

    await verifyCollisionBoundary(page);
}

test.describe('stabilization gate', () => {
    test('manual regression checklist passes on desktop', async ({ page }) => {
        await runChecklist(page);
    });

    test.describe('mobile emulation', () => {
        test.use({
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true
        });

        test('manual regression checklist passes on mobile emulation', async ({ page }) => {
            await runChecklist(page, { isTouch: true });
        });
    });
});