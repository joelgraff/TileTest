import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './testUtils.js';

describe('boot html', () => {
    it('does not contain literal cache-busting template strings', () => {
        const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

        expect(indexHtml.includes('${Date.now()}')).toBe(false);
    });
});