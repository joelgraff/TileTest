import { expect, test } from '@playwright/test';

test('game boots and renders without startup runtime errors', async ({ page }) => {
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

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Tilemap Game/);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });

    expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});