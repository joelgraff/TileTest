import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './testUtils.js';

function readFile(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('dashboard paths', () => {
    it('uses relative asset and navigation paths for the vendor page', () => {
        const vendorHtml = readFile('vendor.html');

        expect(vendorHtml).toContain('href="dashboard.css"');
        expect(vendorHtml).toContain('src="dashboard.js"');
        expect(vendorHtml).toContain('href="./" target="_blank" rel="noreferrer">Open Game</a>');
        expect(vendorHtml).toContain('href="./admin.html"');
        expect(vendorHtml).not.toContain('href="/dashboard.css"');
        expect(vendorHtml).not.toContain('src="/dashboard.js"');
        expect(vendorHtml).not.toContain('href="/admin"');
        expect(vendorHtml).not.toContain('href="/" target="_blank" rel="noreferrer">Open Game</a>');
    });

    it('uses relative asset and navigation paths for the admin page', () => {
        const adminHtml = readFile('admin.html');

        expect(adminHtml).toContain('href="dashboard.css"');
        expect(adminHtml).toContain('src="dashboard.js"');
        expect(adminHtml).toContain('href="./" target="_blank" rel="noreferrer">Open Game</a>');
        expect(adminHtml).toContain('href="./vendor.html"');
        expect(adminHtml).not.toContain('href="/dashboard.css"');
        expect(adminHtml).not.toContain('src="/dashboard.js"');
        expect(adminHtml).not.toContain('href="/vendor"');
        expect(adminHtml).not.toContain('href="/" target="_blank" rel="noreferrer">Open Game</a>');
    });

    it('uses relative fetch paths in the dashboard script', () => {
        const dashboardJs = readFile('dashboard.js');

        expect(dashboardJs).toContain("loadJsonWithFallback('api/vendors', 'vendors.json'");
        expect(dashboardJs).toContain("loadJsonWithFallback('api/vendor-content', null");
        expect(dashboardJs).toContain("loadJsonWithFallback('api/discovery-trails', 'discovery_trails.json'");
        expect(dashboardJs).toContain("fetchJson('api/vendor-content'");
        expect(dashboardJs).not.toContain("/api/vendors");
        expect(dashboardJs).not.toContain("/api/vendor-content");
        expect(dashboardJs).not.toContain("/api/discovery-trails");
        expect(dashboardJs).not.toContain("'/vendors.json'");
        expect(dashboardJs).not.toContain("'/discovery_trails.json'");
    });
});