import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createLiveVendorContentService,
    LiveVendorContentService
} from '../../liveVendorContentService.js';

describe('live vendor content service', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
        if (originalWindow === undefined) {
            delete globalThis.window;
        } else {
            globalThis.window = originalWindow;
        }
    });

    it('fetches live content snapshots and exposes them by vendor id', async () => {
        const fetchImpl = vi.fn(async () => ({
            ok: true,
            json: async () => ({
                vendors: [{
                    vendorId: '100',
                    descriptionOverride: 'Live booth note.',
                    featuredItems: ['Portable demo'],
                    announcements: ['Demo at 2 PM']
                }]
            })
        }));
        const service = new LiveVendorContentService({ fetchImpl, pollIntervalMs: 0 });

        await expect(service.refresh()).resolves.toBe(true);

        expect(fetchImpl).toHaveBeenCalledWith('/api/vendor-content', {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        expect(service.isAvailable).toBe(true);
        expect(service.getContentForVendor('100')).toMatchObject({
            descriptionOverride: 'Live booth note.',
            featuredItems: ['Portable demo'],
            announcements: ['Demo at 2 PM']
        });
        expect(service.getAnnouncementsForVendor('100')).toEqual(['Demo at 2 PM']);
    });

    it('fails quietly when the live endpoint is unavailable', async () => {
        const setIntervalImpl = vi.fn();
        const service = new LiveVendorContentService({
            fetchImpl: vi.fn(async () => ({ ok: false })),
            setIntervalImpl,
            pollIntervalMs: 0
        });

        await expect(service.refresh()).resolves.toBe(false);

        expect(service.isAvailable).toBe(false);
        expect(service.getAnnouncementsForVendor('100')).toEqual([]);
        expect(setIntervalImpl).not.toHaveBeenCalled();
    });

    it('keeps static frontend mode quiet by not polling when the backend is absent', async () => {
        const setIntervalImpl = vi.fn();
        const fetchImpl = vi.fn(async () => ({ ok: false }));
        const service = new LiveVendorContentService({
            fetchImpl,
            setIntervalImpl,
            pollIntervalMs: 5000
        });

        await expect(service.start()).resolves.toBe(false);

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(service.started).toBe(true);
        expect(service.isAvailable).toBe(false);
        expect(service.getAnnouncementsForVendor('100')).toEqual([]);
        expect(setIntervalImpl).not.toHaveBeenCalled();
    });

    it('does not create the default live service unless the live backend flag is present', () => {
        globalThis.window = {
            fetch: vi.fn(),
            setInterval: vi.fn(),
            clearInterval: vi.fn()
        };

        expect(createLiveVendorContentService()).toBeNull();

        globalThis.window.__tileTestLiveBackend = true;

        expect(createLiveVendorContentService()).toBeInstanceOf(LiveVendorContentService);
    });

    it('polls only after the first live endpoint request succeeds', async () => {
        const setIntervalImpl = vi.fn();
        const fetchImpl = vi.fn(async () => ({
            ok: true,
            json: async () => ({ announcements: [] })
        }));
        const service = new LiveVendorContentService({
            fetchImpl,
            setIntervalImpl,
            pollIntervalMs: 5000
        });

        await service.start();

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(setIntervalImpl).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
});
