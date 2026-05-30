import { describe, expect, it, vi } from 'vitest';

import { LiveVendorContentService } from '../../liveVendorContentService.js';

describe('live vendor content service', () => {
    it('fetches live announcement snapshots and exposes them by vendor id', async () => {
        const fetchImpl = vi.fn(async () => ({
            ok: true,
            json: async () => ({
                announcements: [{ vendorId: '100', announcements: ['Demo at 2 PM'] }]
            })
        }));
        const service = new LiveVendorContentService({ fetchImpl, pollIntervalMs: 0 });

        await expect(service.refresh()).resolves.toBe(true);

        expect(fetchImpl).toHaveBeenCalledWith('/api/vendor-announcements', {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        expect(service.isAvailable).toBe(true);
        expect(service.getAnnouncementsForVendor('100')).toEqual(['Demo at 2 PM']);
    });

    it('fails quietly when the live endpoint is unavailable', async () => {
        const service = new LiveVendorContentService({
            fetchImpl: vi.fn(async () => ({ ok: false })),
            pollIntervalMs: 0
        });

        await expect(service.refresh()).resolves.toBe(false);

        expect(service.isAvailable).toBe(false);
        expect(service.getAnnouncementsForVendor('100')).toEqual([]);
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
