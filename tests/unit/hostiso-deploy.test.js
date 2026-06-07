import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');
const packagerPath = path.join(repoRoot, 'scripts', 'package_hostiso.py');

function runPackager(mode) {
    const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), `tiletest-hostiso-${mode}-`));
    execFileSync('python3', [packagerPath, '--mode', mode, '--output-root', outputRoot], {
        cwd: repoRoot,
        encoding: 'utf8'
    });

    return {
        bundleRoot: path.join(outputRoot, mode),
        outputRoot
    };
}

describe('hostiso deployment packaging', () => {
    it('keeps the static bundle free of live server files', () => {
        const { bundleRoot, outputRoot } = runPackager('static');

        try {
            expect(fs.existsSync(path.join(bundleRoot, 'index.html'))).toBe(true);
            expect(fs.existsSync(path.join(bundleRoot, 'server.js'))).toBe(false);
            expect(fs.existsSync(path.join(bundleRoot, 'discoveryTrailStore.js'))).toBe(false);
            expect(fs.existsSync(path.join(bundleRoot, 'liveVendorAnnouncementStore.js'))).toBe(false);
            expect(fs.existsSync(path.join(bundleRoot, 'package.json'))).toBe(false);
            expect(fs.existsSync(path.join(outputRoot, 'static.zip'))).toBe(true);
        } finally {
            fs.rmSync(outputRoot, { recursive: true, force: true });
        }
    });

    it('keeps the live bundle runnable with the Node entrypoint', () => {
        const { bundleRoot, outputRoot } = runPackager('live');

        try {
            expect(fs.existsSync(path.join(bundleRoot, 'server.js'))).toBe(true);
            expect(fs.existsSync(path.join(bundleRoot, 'discoveryTrailStore.js'))).toBe(true);
            expect(fs.existsSync(path.join(bundleRoot, 'liveVendorAnnouncementStore.js'))).toBe(true);
            expect(fs.existsSync(path.join(bundleRoot, 'package.json'))).toBe(true);
            expect(fs.existsSync(path.join(bundleRoot, 'package-lock.json'))).toBe(false);
            expect(fs.existsSync(path.join(outputRoot, 'live.zip'))).toBe(true);
        } finally {
            fs.rmSync(outputRoot, { recursive: true, force: true });
        }
    });
});