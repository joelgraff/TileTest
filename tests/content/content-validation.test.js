import { describe, expect, it } from 'vitest';

import CONFIG from '../../config.js';
import { loadJson } from './testUtils.js';

describe('content validation', () => {
    const domains = loadJson(`${CONFIG.CONTENT.DOMAINS}${CONFIG.PATHS.JSON_EXTENSION}`);
    const discoveryTrails = loadJson(`${CONFIG.CONTENT.DISCOVERY_TRAILS}${CONFIG.PATHS.JSON_EXTENSION}`);
    const vendors = loadJson(`${CONFIG.CONTENT.VENDORS}${CONFIG.PATHS.JSON_EXTENSION}`);

    function expectTextList(value, fieldName) {
        expect(Array.isArray(value), `${fieldName} should be an array`).toBe(true);

        for (const item of value) {
            expect(typeof item, `${fieldName} entries should be strings`).toBe('string');
            expect(item.trim().length, `${fieldName} entries should not be blank`).toBeGreaterThan(0);
        }
    }

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

            if (vendor.clueText !== undefined) {
                expect(typeof vendor.clueText).toBe('string');
                expect(vendor.clueText.trim().length).toBeGreaterThan(0);
            }

            if (vendor.featuredItems !== undefined) {
                expectTextList(vendor.featuredItems, `${vendor.id}.featuredItems`);
            }

            if (vendor.announcements !== undefined) {
                expectTextList(vendor.announcements, `${vendor.id}.announcements`);
            }

            vendorIds.add(vendor.id);
        }
    });

    it('bundles authored static content for deterministic sample-map discovery vendors', () => {
        const sampleVendorIds = ['100', '101'];
        const sampleVendors = sampleVendorIds.map(vendorId => vendors.find(vendor => vendor.id === vendorId));

        expect(sampleVendors.every(Boolean)).toBe(true);

        for (const vendor of sampleVendors) {
            expect(typeof vendor.clueText).toBe('string');
            expect(vendor.clueText.trim().length).toBeGreaterThan(0);
            expectTextList(vendor.featuredItems, `${vendor.id}.featuredItems`);
            expectTextList(vendor.announcements, `${vendor.id}.announcements`);
        }
    });

    it('defines authored discovery trails with valid vendor references', () => {
        expect(Array.isArray(discoveryTrails)).toBe(true);
        expect(discoveryTrails.length).toBeGreaterThan(0);

        const trailIds = new Set();
        const vendorIds = new Set(vendors.map(vendor => vendor.id));

        for (const trail of discoveryTrails) {
            expect(typeof trail.id).toBe('string');
            expect(trail.id.trim().length).toBeGreaterThan(0);
            expect(trailIds.has(trail.id)).toBe(false);
            expect(typeof trail.title).toBe('string');
            expect(trail.title.trim().length).toBeGreaterThan(0);
            expect(typeof trail.description).toBe('string');
            expect(trail.description.trim().length).toBeGreaterThan(0);
            expect(Array.isArray(trail.stops)).toBe(true);
            expect(trail.stops.length).toBeGreaterThanOrEqual(2);
            expect(typeof trail.reward?.points).toBe('number');
            expect(trail.reward.points).toBeGreaterThan(0);
            expect(typeof trail.reward.description).toBe('string');
            expect(trail.reward.description.trim().length).toBeGreaterThan(0);

            const stopIds = new Set();
            const stopVendorIds = new Set();
            for (const stop of trail.stops) {
                expect(typeof stop.id).toBe('string');
                expect(stop.id.trim().length).toBeGreaterThan(0);
                expect(stopIds.has(stop.id)).toBe(false);
                expect(typeof stop.vendorId).toBe('string');
                expect(vendorIds.has(stop.vendorId), `${trail.id} references missing vendor ${stop.vendorId}`).toBe(true);
                expect(stopVendorIds.has(stop.vendorId)).toBe(false);
                expect(typeof stop.clueText).toBe('string');
                expect(stop.clueText.trim().length).toBeGreaterThan(0);
                expect(typeof stop.goalText).toBe('string');
                expect(stop.goalText.trim().length).toBeGreaterThan(0);

                stopIds.add(stop.id);
                stopVendorIds.add(stop.vendorId);
            }

            trailIds.add(trail.id);
        }
    });
});