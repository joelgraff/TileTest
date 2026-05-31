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

    const dialogSurface = page.locator('#ui-overlay-root [data-dialog-surface="dom"]');

    await talkToVendor(page, 0);

    const firstVisit = await page.evaluate(() => window.__tileTest.testApi.getDiscoveryQuestSnapshot());

    expect(firstVisit.active).toBe(true);
    expect(firstVisit.completed).toBe(false);
    expect(firstVisit.visitedCount).toBe(1);
    expect(firstVisit.objectives[0].visited).toBe(true);
    expect(firstVisit.objectives[0].clue).toBeTruthy();

    const firstVisitDialog = await page.evaluate(() => window.__tileTest.testApi.getDialogSnapshot());

    expect(firstVisitDialog.text).toContain('Passport stamp earned:');
    expect(firstVisitDialog.text).toContain('Discovery Passport progress: 1/2 vendors visited.');
    await expect(dialogSurface).toContainText('Passport stamp earned:');
    await expect(dialogSurface).toContainText('Discovery Passport progress: 1/2 vendors visited.');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    await talkToVendor(page, 0);

    const revisit = await page.evaluate(() => ({
        dialog: window.__tileTest.testApi.getDialogSnapshot(),
        discovery: window.__tileTest.testApi.getDiscoveryQuestSnapshot()
    }));

    expect(revisit.discovery.visitedCount).toBe(1);
    expect(revisit.dialog.text).not.toContain('Passport stamp earned:');
    await expect(dialogSurface).not.toContainText('Passport stamp earned:');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const questDialog = await page.evaluate(() => window.__tileTest.testApi.openQuestDialog());

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

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__tileTest.testApi.getFlags().isDialogOpen);

    const festivalLog = await page.evaluate(() => window.__tileTest.testApi.getFestivalLogSnapshot());

    expect(festivalLog.completedTrailCount).toBe(1);
    expect(festivalLog.stampCount).toBe(2);
    expect(festivalLog.stamps.map(stamp => stamp.vendorId)).toEqual(
        completed.objectives.map(objective => objective.vendorId)
    );

    const completedQuestDialog = await page.evaluate(() => window.__tileTest.testApi.openQuestDialog());

    expect(completedQuestDialog.textItems).toContain('=== FESTIVAL LOG ===');
    expect(completedQuestDialog.textItems).toContain('Completed trails:');
    expect(completedQuestDialog.textItems).toContain('1. Discovery Passport ✓');
    await expect(dialogSurface).toContainText('FESTIVAL LOG');
    await expect(dialogSurface).toContainText('Completed trails:');

    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(unexpectedConsoleErrors, `Console errors: ${unexpectedConsoleErrors.join('\n')}`).toEqual([]);
});