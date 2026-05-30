import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');
const liveContent = {
    descriptionOverride: 'Live smoke description override from the dashboard.',
    featuredItem: 'Live smoke featured disk imaging kit',
    announcement: 'Live smoke announcement: dashboard content reached the game.',
    clueText: 'Live smoke clue: ask about the hidden diagnostic disk.'
};

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function getFreePort() {
    return new Promise((resolve, reject) => {
        const probe = createServer();

        probe.on('error', reject);
        probe.listen(0, '127.0.0.1', () => {
            const address = probe.address();

            if (!address || typeof address === 'string') {
                probe.close(() => reject(new Error('Unable to allocate a live server port.')));
                return;
            }

            probe.close(() => resolve(address.port));
        });
    });
}

async function waitForLiveServer({ baseUrl, process: serverProcess, getOutput }) {
    const startedAt = Date.now();
    const timeoutMs = 10000;

    while (Date.now() - startedAt < timeoutMs) {
        if (serverProcess.exitCode !== null || serverProcess.signalCode !== null) {
            throw new Error(`Live server exited before it became ready.\n${getOutput()}`);
        }

        try {
            const response = await fetch(`${baseUrl}/api/vendors`, {
                headers: { Accept: 'application/json' }
            });

            if (response.ok) {
                return;
            }
        } catch {
            // Server is still starting.
        }

        await delay(100);
    }

    throw new Error(`Timed out waiting for the live server.\n${getOutput()}`);
}

async function startLiveServer() {
    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const output = [];
    const serverProcess = spawn(process.execPath, ['server.js'], {
        cwd: repoRoot,
        env: {
            ...process.env,
            HOST: '127.0.0.1',
            PORT: String(port)
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', chunk => {
        output.push(chunk.toString());
    });
    serverProcess.stderr.on('data', chunk => {
        output.push(chunk.toString());
    });

    const liveServer = {
        baseUrl,
        process: serverProcess,
        getOutput: () => output.join('')
    };

    try {
        await waitForLiveServer(liveServer);
    } catch (error) {
        await stopLiveServer(liveServer);
        throw error;
    }

    return liveServer;
}

async function stopLiveServer(liveServer) {
    if (liveServer.process.exitCode !== null || liveServer.process.signalCode !== null) {
        return;
    }

    await new Promise(resolve => {
        const timeout = setTimeout(resolve, 5000);

        liveServer.process.once('exit', () => {
            clearTimeout(timeout);
            resolve();
        });
        liveServer.process.kill('SIGTERM');
    });
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.headers ?? {})
        }
    });

    expect(response.ok, `${url} returned ${response.status}`).toBe(true);
    return response.json();
}

async function gotoLiveGame(page, baseUrl) {
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

    await page.goto(`${baseUrl}/?test=1`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Tilemap Game/);
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await page.waitForFunction(() => window.__tileTest?.testApi?.isReady?.());

    return { consoleErrors, pageErrors };
}

async function saveLiveContentThroughDashboard(page, baseUrl, targetVendor) {
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(vendorId => (
        Array.from(document.querySelector('#vendor-select')?.options ?? [])
            .some(option => option.value === vendorId)
    ), targetVendor.id);

    await page.selectOption('#vendor-select', targetVendor.id);
    await page.fill('#description-input', liveContent.descriptionOverride);
    await page.fill('#featured-input', liveContent.featuredItem);
    await page.fill('#announcement-input', liveContent.announcement);
    await page.fill('#clue-input', liveContent.clueText);
    await page.click('button[type="submit"]');

    await expect(page.locator('#status')).toContainText('Saved.');
    await expect(page.locator('#content-list')).toContainText(`Clue: ${liveContent.clueText}`);

    const savedContent = await fetchJson(`${baseUrl}/api/vendor-content`);
    const savedVendorContent = savedContent.vendors.find(entry => entry.vendorId === targetVendor.id);

    expect(savedVendorContent).toMatchObject({
        vendorId: targetVendor.id,
        descriptionOverride: liveContent.descriptionOverride,
        featuredItems: [liveContent.featuredItem],
        announcements: [liveContent.announcement],
        clueText: liveContent.clueText
    });
}

test('dashboard-authored live vendor content appears in the game vendor dialog and discovery clue', async ({ page }) => {
    const liveServer = await startLiveServer();

    try {
        const vendorPayload = await fetchJson(`${liveServer.baseUrl}/api/vendors`);
        const targetVendor = vendorPayload.vendors[0];

        expect(targetVendor?.id).toBeTruthy();
        await saveLiveContentThroughDashboard(page, liveServer.baseUrl, targetVendor);

        const { consoleErrors, pageErrors } = await gotoLiveGame(page, liveServer.baseUrl);

        await page.waitForFunction(
            ({ vendorId, descriptionOverride, featuredItem, announcement, clueText }) => {
                const service = window.__tileTest?.scene?.liveVendorContentService;
                const content = service?.getContentForVendor?.(vendorId);

                return Boolean(
                    window.__tileTestLiveBackend === true
                    && service?.isAvailable
                    && content?.descriptionOverride === descriptionOverride
                    && content?.featuredItems?.includes(featuredItem)
                    && content?.announcements?.includes(announcement)
                    && content?.clueText === clueText
                );
            },
            {
                vendorId: targetVendor.id,
                ...liveContent
            }
        );

        const seededDiscovery = await page.evaluate(() => window.__tileTest.testApi.seedDiscoveryPassportFixture(2));

        expect(seededDiscovery.active).toBe(true);
        expect(seededDiscovery.objectives[0].vendorId).toBe(targetVendor.id);

        await page.evaluate(() => {
            window.__tileTest.testApi.positionPlayerNearVendor(0);
        });
        await page.keyboard.press('Space');
        await page.waitForFunction(() => window.__tileTest.testApi.getFlags().isDialogOpen);

        const state = await page.evaluate(() => {
            const scene = window.__tileTest.scene;
            const npc = scene.npcGroup.getChildren()[0];

            return {
                assignedVendorId: npc.vendorData.id,
                dialog: window.__tileTest.testApi.getDialogSnapshot(),
                profile: scene.vendorManager.getVendorContentProfile(npc.vendorData),
                discovery: window.__tileTest.testApi.getDiscoveryQuestSnapshot()
            };
        });
        const dialogSurface = page.locator('#ui-overlay-root [data-dialog-surface="dom"]');

        expect(state.assignedVendorId).toBe(targetVendor.id);
        expect(state.profile).toMatchObject({
            description: liveContent.descriptionOverride,
            descriptionOverride: liveContent.descriptionOverride
        });
        expect(state.profile.featuredItems).toContain(liveContent.featuredItem);
        expect(state.profile.announcements).toContain(liveContent.announcement);
        expect(state.profile.clueText).toBe(liveContent.clueText);
        expect(state.discovery.objectives[0]).toMatchObject({
            vendorId: targetVendor.id,
            clue: liveContent.clueText,
            visited: true
        });
        expect(state.dialog.text).toContain(liveContent.descriptionOverride);
        expect(state.dialog.text).toContain(liveContent.featuredItem);
        expect(state.dialog.text).toContain(liveContent.announcement);
        expect(state.dialog.text).toContain(liveContent.clueText);
        await expect(dialogSurface).toContainText(liveContent.descriptionOverride);
        await expect(dialogSurface).toContainText(liveContent.featuredItem);
        await expect(dialogSurface).toContainText(liveContent.announcement);
        await expect(dialogSurface).toContainText(liveContent.clueText);
        expect(pageErrors, `Page errors: ${pageErrors.join('\n')}`).toEqual([]);
        expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    } finally {
        await stopLiveServer(liveServer);
    }
});