import { describe, expect, it } from 'vitest';

import {
    normalizeAnnouncementLines,
    normalizeVendorAnnouncementSnapshot,
    VendorAnnouncementStore
} from '../../liveVendorAnnouncementStore.js';

describe('live vendor announcement store', () => {
    it('normalizes dashboard announcement text into vendor announcement entries', () => {
        expect(normalizeAnnouncementLines(' Demo at 2 PM\n\n Bring a badge ')).toEqual([
            'Demo at 2 PM',
            'Bring a badge'
        ]);
        expect(normalizeVendorAnnouncementSnapshot({
            announcements: {
                100: 'Demo at 2 PM',
                101: [{ text: 'Tournament starts at noon' }],
                empty: '   '
            }
        })).toEqual([
            { vendorId: '100', announcements: ['Demo at 2 PM'] },
            { vendorId: '101', announcements: ['Tournament starts at noon'] }
        ]);
    });

    it('stores, replaces, and clears announcements by vendor id', () => {
        const store = new VendorAnnouncementStore();

        expect(store.applyUpdate({ vendorId: 100, announcement: 'Demo at 2 PM' })).toEqual({
            vendorId: '100',
            announcements: ['Demo at 2 PM']
        });
        expect(store.getAnnouncementsForVendor('100')).toEqual(['Demo at 2 PM']);

        store.replaceSnapshot({
            announcements: [
                { vendorId: '101', announcements: ['Tournament starts at noon'] },
                { vendor_id: '100', text: 'Restoration talk at 4 PM' }
            ]
        });

        expect(store.toJSON()).toEqual({
            announcements: [
                { vendorId: '100', announcements: ['Restoration talk at 4 PM'] },
                { vendorId: '101', announcements: ['Tournament starts at noon'] }
            ]
        });

        store.applyUpdate({ vendorId: '100', announcements: [] });

        expect(store.getAnnouncementsForVendor('100')).toEqual([]);
        expect(store.toJSON()).toEqual({
            announcements: [
                { vendorId: '101', announcements: ['Tournament starts at noon'] }
            ]
        });
    });
});
