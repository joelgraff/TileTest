import { defineConfig } from '@playwright/test';

const staticHost = '127.0.0.1';
const staticPort = Number.parseInt(process.env.PLAYWRIGHT_STATIC_PORT ?? '5199', 10);
const providedBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const staticBaseURL = `http://${staticHost}:${staticPort}`;
const webServer = providedBaseURL
    ? null
    : {
        command: `python -m http.server ${staticPort} --bind ${staticHost}`,
        url: staticBaseURL,
        cwd: '.',
        reuseExistingServer: false,
        timeout: 120000
    };

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60000,
    use: {
        baseURL: providedBaseURL ?? staticBaseURL,
        headless: true
    },
    ...(webServer ? { webServer } : {})
});
