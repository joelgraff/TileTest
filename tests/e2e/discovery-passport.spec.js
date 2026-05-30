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

async function talkToVendor(page, index) {
    await page.evaluate(vendorIndex => {
        window.__tileTest.testApi.positionPlayerNearVendor(vendorIndex);
    }, index);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isDialogOpen);
}

test('discovery passport advances and completes by talking to required vendors', async ({ page }) => {
    const { consoleErrors, pageErrors } = await gotoGame(page);
    const unexpectedConsoleErrors = consoleErrors.filter(message => (
        message !== 'Failed to load resource: the server responded with a status of 404 (Not Found)'
    ));

    const seeded = await page.evaluate(() => window.__tileTest.testApi.seedDiscoveryPassportFixture(2));

    expect(seeded.active).toBe(true);
    expect(seeded.completed).toBe(false);
    expect(seeded.totalCount).toBe(2);
    expect(seeded.visitedCount).toBe(0);

    await talkToVendor(page, 0);

    const firstVisit = await page.evaluate(() => window.__tileTest.testApi.getDiscoveryQuestSnapshot());

    expect(firstVisit.active).toBe(true);
    expect(firstVisit.completed).toBe(false);
    expect(firstVisit.visitedCount).toBe(1);
    expect(firstVisit.objectives[0].visited).toBe(true);
    expect(firstVisit.objectives[0].clue).toBeTruthy();

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const questDialog = await page.evaluate(() => window.__tileTest.testApi.openQuestDialog());
    const dialogSurface = page.locator('#ui-overlay-root [data-dialog-surface="dom"]');

    expect(questDialog.textItems).toContain('   Progress: 1/2 vendors visited');
    expect(questDialog.textItems.some(item => item.includes('items collected'))).toBe(false);
    await expect(dialogSurface).toContainText('Progress: 1/2 vendors visited');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    await talkToVendor(page, 1);

    const completed = await page.evaluate(() => window.__tileTest.testApi.getDiscoveryQuestSnapshot());

    expect(completed.active).toBe(false);
    expect(completed.completed).toBe(true);
    expect(completed.visitedCount).toBe(2);
    expect(completed.objectives.every(objective => objective.visited)).toBe(true);
    await expect(dialogSurface).toContainText('Quest Completed!');
    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(unexpectedConsoleErrors, `Console errors: ${unexpectedConsoleErrors.join('\n')}`).toEqual([]);
});