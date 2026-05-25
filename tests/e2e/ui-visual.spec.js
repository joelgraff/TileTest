import { expect, test } from '@playwright/test';

async function gotoGame(page) {
    await page.goto('/?test=1', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => window.__tileTest?.testApi?.isReady?.());
}

async function expectOverlayScreenshot(page, snapshotName) {
    await page.evaluate(() => {
        const gameContainer = document.getElementById('game-container');

        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
        }
    });

    await expect(page.locator('#ui-overlay-root')).toHaveScreenshot(snapshotName, {
        animations: 'disabled',
        caret: 'hide'
    });
}

test.describe('ui visual coverage', () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test('hud overlay matches the baseline', async ({ page }) => {
        await gotoGame(page);

        await expectOverlayScreenshot(page, 'hud-overlay.png');
    });

    test('help dialog overlay matches the baseline', async ({ page }) => {
        await gotoGame(page);

        await page.evaluate(() => {
            window.__tileTest.testApi.openHelpDialog();
        });
        await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isDialogOpen);

        await expectOverlayScreenshot(page, 'help-overlay.png');
    });

    test('inventory dialog overlay matches the baseline', async ({ page }) => {
        await gotoGame(page);

        await page.evaluate(() => {
            window.__tileTest.testApi.seedPanelFixtures();
        });
        await page.locator('[data-hud-control="inventory"]').click();
        await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isInventoryOpen);

        await expectOverlayScreenshot(page, 'inventory-overlay.png');
    });

    test('quest dialog overlay matches the baseline', async ({ page }) => {
        await gotoGame(page);

        await page.evaluate(() => {
            window.__tileTest.testApi.seedPanelFixtures();
        });
        await page.locator('[data-hud-control="quests"]').click();
        await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isQuestsOpen);

        await expectOverlayScreenshot(page, 'quest-overlay.png');
    });
});