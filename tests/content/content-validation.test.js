import { describe, expect, it } from 'vitest';

import { loadJson } from './testUtils.js';

describe('content validation', () => {
    const domains = loadJson('technology_domains.json');
    const vendors = loadJson('vendors.json');

    it('defines technology domains with required fields', () => {
        expect(Array.isArray(domains)).toBe(true);
        expect(domains.length).toBeGreaterThan(0);

        const domainIds = new Set();

        for (const domain of domains) {
            expect(typeof domain.id).toBe('string');
            expect(domain.id.length).toBeGreaterThan(0);
            expect(domainIds.has(domain.id)).toBe(false);
            expect(typeof domain.name).toBe('string');
            expect(Array.isArray(domain.items)).toBe(true);
            expect(Array.isArray(domain.facts)).toBe(true);

            domainIds.add(domain.id);
        }
    });

    it('defines vendors with valid domain references and dialog responses', () => {
        expect(Array.isArray(vendors)).toBe(true);
        expect(vendors.length).toBeGreaterThan(0);

        const domainIds = new Set(domains.map(domain => domain.id));
        const vendorIds = new Set();

        for (const vendor of vendors) {
            expect(typeof vendor.id).toBe('string');
            expect(vendor.id.length).toBeGreaterThan(0);
            expect(vendorIds.has(vendor.id)).toBe(false);
            expect(typeof vendor.name).toBe('string');
            expect(typeof vendor.booth).toBe('string');
            expect(typeof vendor.description).toBe('string');
            expect(domainIds.has(vendor.domain_id)).toBe(true);

            expect(vendor.dialog).toBeTruthy();
            expect(Array.isArray(vendor.dialog.responses)).toBe(true);
            expect(vendor.dialog.responses.length).toBeGreaterThan(0);
            expect(vendor.dialog.responses.some(response => response.action === 'end')).toBe(true);

            vendorIds.add(vendor.id);
        }
    });
});