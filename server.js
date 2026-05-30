import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VendorAnnouncementStore } from './liveVendorAnnouncementStore.js';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.HOST ?? '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '5000', 10);
const announcementStore = new VendorAnnouncementStore();

const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.md', 'text/markdown; charset=utf-8'],
    ['.png', 'image/png'],
    ['.tmx', 'application/xml; charset=utf-8'],
    ['.tsx', 'application/xml; charset=utf-8']
]);

function sendJson(response, statusCode, payload) {
    const body = JSON.stringify(payload);
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    response.end(body);
}

function sendMethodNotAllowed(response) {
    sendJson(response, 405, { error: 'Method not allowed' });
}

async function readJsonBody(request) {
    let body = '';

    for await (const chunk of request) {
        body += chunk;
        if (body.length > 1024 * 64) {
            throw new Error('Request body is too large');
        }
    }

    return body.trim().length > 0 ? JSON.parse(body) : {};
}

async function readVendors() {
    const vendorFile = await fs.readFile(path.join(repoRoot, 'vendors.json'), 'utf8');
    const vendors = JSON.parse(vendorFile);

    return vendors.map(({ id, name, booth }) => ({ id, name, booth }));
}

async function handleApiRequest(request, response, requestUrl) {
    if (requestUrl.pathname === '/api/vendor-announcements') {
        if (request.method === 'GET') {
            sendJson(response, 200, announcementStore.toJSON());
            return true;
        }

        if (request.method === 'POST') {
            try {
                const update = announcementStore.applyUpdate(await readJsonBody(request));
                if (!update) {
                    sendJson(response, 400, { error: 'A vendorId and announcement text are required.' });
                    return true;
                }

                sendJson(response, 200, {
                    ...announcementStore.toJSON(),
                    updated: update
                });
            } catch (error) {
                sendJson(response, 400, { error: error.message });
            }

            return true;
        }

        sendMethodNotAllowed(response);
        return true;
    }

    if (requestUrl.pathname === '/api/vendors') {
        if (request.method !== 'GET') {
            sendMethodNotAllowed(response);
            return true;
        }

        try {
            sendJson(response, 200, { vendors: await readVendors() });
        } catch (error) {
            sendJson(response, 500, { error: error.message });
        }

        return true;
    }

    return false;
}

function getStaticFilePath(pathname) {
    let resolvedPathname = pathname;

    if (resolvedPathname === '/') {
        resolvedPathname = '/index.html';
    }

    if (resolvedPathname === '/dashboard') {
        resolvedPathname = '/dashboard.html';
    }

    const filePath = path.resolve(repoRoot, `.${decodeURIComponent(resolvedPathname)}`);
    if (!filePath.startsWith(`${repoRoot}${path.sep}`)) {
        return null;
    }

    return filePath;
}

async function serveStaticFile(request, response, requestUrl) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendMethodNotAllowed(response);
        return;
    }

    let filePath;
    try {
        filePath = getStaticFilePath(requestUrl.pathname);
    } catch {
        sendJson(response, 400, { error: 'Invalid path' });
        return;
    }

    if (!filePath) {
        sendJson(response, 403, { error: 'Forbidden' });
        return;
    }

    try {
        const body = await fs.readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
            'Cache-Control': 'no-store'
        });

        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        response.end(body);
    } catch {
        sendJson(response, 404, { error: 'Not found' });
    }
}

const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    void handleApiRequest(request, response, requestUrl).then((handled) => {
        if (!handled) {
            void serveStaticFile(request, response, requestUrl);
        }
    });
});

server.listen(port, host, () => {
    console.log(`TileTest live server listening at http://${host}:${port}`);
    console.log(`Dashboard available at http://${host}:${port}/dashboard`);
});
