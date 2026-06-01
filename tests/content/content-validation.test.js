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

    function expectTopicList(value, fieldName) {
        expect(Array.isArray(value), `${fieldName} should be an array`).toBe(true);

        for (const topic of value) {
            expect(topic && typeof topic === 'object', `${fieldName} entries should be topic objects`).toBe(true);
            expect(typeof topic.id, `${fieldName}.id should be a string`).toBe('string');
            expect(topic.id.trim().length, `${fieldName}.id should not be blank`).toBeGreaterThan(0);
            expect(typeof topic.label, `${fieldName}.label should be a string`).toBe('string');
            expect(topic.label.trim().length, `${fieldName}.label should not be blank`).toBeGreaterThan(0);
            expect(typeof topic.response, `${fieldName}.response should be a string`).toBe('string');
            expect(topic.response.trim().length, `${fieldName}.response should not be blank`).toBeGreaterThan(0);

            if (topic.completionMarker !== undefined) {
                expect(typeof topic.completionMarker).toBe('string');
                expect(topic.completionMarker.trim().length, `${fieldName}.completionMarker should not be blank`).toBeGreaterThan(0);
            }

            if (topic.verification !== undefined) {
                expect(topic.verification && typeof topic.verification, `${fieldName}.verification should be an object`).toBe('object');
                expect(typeof topic.verification.prompt, `${fieldName}.verification.prompt should be a string`).toBe('string');
                expect(topic.verification.prompt.trim().length, `${fieldName}.verification.prompt should not be blank`).toBeGreaterThan(0);
                expect(typeof topic.verification.expectedPhrase, `${fieldName}.verification.expectedPhrase should be a string`).toBe('string');
                expect(topic.verification.expectedPhrase.trim().length, `${fieldName}.verification.expectedPhrase should not be blank`).toBeGreaterThan(0);
                expect(typeof topic.verification.successText, `${fieldName}.verification.successText should be a string`).toBe('string');
                expect(topic.verification.successText.trim().length, `${fieldName}.verification.successText should not be blank`).toBeGreaterThan(0);
                expect(typeof topic.verification.failureText, `${fieldName}.verification.failureText should be a string`).toBe('string');
                expect(topic.verification.failureText.trim().length, `${fieldName}.verification.failureText should not be blank`).toBeGreaterThan(0);
                expectTextList(topic.verification.choices, `${fieldName}.verification.choices`);
                expect(topic.verification.choices).toContain(topic.verification.expectedPhrase);
            }
        }
    }

    function expectDiscoveryStopList(value, fieldName) {
        expect(Array.isArray(value), `${fieldName} should be an array`).toBe(true);

        for (const stop of value) {
            expect(stop && typeof stop === 'object', `${fieldName} entries should be objects`).toBe(true);
            expect(typeof stop.id, `${fieldName}.id should be a string`).toBe('string');
            expect(stop.id.trim().length, `${fieldName}.id should not be blank`).toBeGreaterThan(0);
            expect(typeof stop.vendorId, `${fieldName}.vendorId should be a string`).toBe('string');
            expect(stop.vendorId.trim().length, `${fieldName}.vendorId should not be blank`).toBeGreaterThan(0);
            expect(typeof stop.clueText, `${fieldName}.clueText should be a string`).toBe('string');
            expect(stop.clueText.trim().length, `${fieldName}.clueText should not be blank`).toBeGreaterThan(0);
            expect(typeof stop.goalText, `${fieldName}.goalText should be a string`).toBe('string');
            expect(stop.goalText.trim().length, `${fieldName}.goalText should not be blank`).toBeGreaterThan(0);

            if (stop.completionMarker !== undefined) {
                expect(typeof stop.completionMarker).toBe('string');
                expect(stop.completionMarker.trim().length, `${fieldName}.completionMarker should not be blank`).toBeGreaterThan(0);
            }
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

            if (vendor.topics !== undefined) {
                expectTopicList(vendor.topics, `${vendor.id}.topics`);
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

        expectTopicList(sampleVendors[0].topics, `${sampleVendors[0].id}.topics`);
        expect(sampleVendors[0].topics[0]).toMatchObject({
            id: 'portable_demo',
            label: 'the portable computer on the table',
            completionMarker: 'portable_demo',
            response: 'That is our portable IBM PC demo. It is a favorite example of a compact system you can still carry around the show floor.',
            verification: {
                prompt: 'Which phrase is posted beside the portable demo?',
                expectedPhrase: 'Luggable Legends',
                choices: expect.arrayContaining(['Luggable Legends'])
            }
        });
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

                if (stop.completionMarker !== undefined) {
                    expect(typeof stop.completionMarker).toBe('string');
                    expect(stop.completionMarker.trim().length).toBeGreaterThan(0);
                }

                stopIds.add(stop.id);
                stopVendorIds.add(stop.vendorId);
            }

            trailIds.add(trail.id);
        }

        expectDiscoveryStopList(discoveryTrails[0].stops, `${discoveryTrails[0].id}.stops`);
        expect(discoveryTrails[0].stops[0]).toMatchObject({
            completionMarker: 'portable_demo'
        });
    });
});