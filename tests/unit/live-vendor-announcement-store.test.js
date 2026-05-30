import { describe, expect, it } from 'vitest';

import {
    normalizeAnnouncementLines,
    normalizeVendorContentSnapshot,
    normalizeVendorAnnouncementSnapshot,
    VendorContentStore,
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

    it('normalizes V1 vendor content fields and ignores unsafe empty content', () => {
        expect(normalizeVendorContentSnapshot({
            vendors: [
                {
                    vendorId: 100,
                    boothDescriptionOverride: '  Hands-on repair bench.  ',
                    featuredItems: [' Osborne 1 ', { name: 'Kaypro II demo' }, ''],
                    announcements: ' Demo at 2 PM\n ',
                    clueText: { text: 'Ask about CP/M.' },
                    moderationStatus: 'needs_review'
                },
                { vendorId: 'empty', featuredItems: [], announcements: [] },
                { vendorId: '100', featuredDemos: ['Disk imaging station'] }
            ]
        })).toEqual([
            {
                vendorId: '100',
                descriptionOverride: 'Hands-on repair bench.',
                featuredItems: ['Osborne 1', 'Kaypro II demo', 'Disk imaging station'],
                announcements: ['Demo at 2 PM'],
                clueText: 'Ask about CP/M.',
                moderationStatus: 'needs_review'
            }
        ]);
    });

    it('stores full vendor content while preserving announcement accessors', () => {
        const store = new VendorContentStore();

        expect(store.applyUpdate({
            vendorId: 100,
            descriptionOverride: 'Try the terminal wall.',
            featuredItems: 'ADM-3A\nVT100',
            announcements: ['Talk at 4 PM'],
            clueText: 'Ask about the serial adapter.'
        })).toMatchObject({
            vendorId: '100',
            descriptionOverride: 'Try the terminal wall.',
            featuredItems: ['ADM-3A', 'VT100'],
            announcements: ['Talk at 4 PM'],
            clueText: 'Ask about the serial adapter.',
            moderationStatus: 'approved'
        });

        expect(store.getContentForVendor('100')).toMatchObject({
            descriptionOverride: 'Try the terminal wall.',
            featuredItems: ['ADM-3A', 'VT100'],
            announcements: ['Talk at 4 PM'],
            clueText: 'Ask about the serial adapter.'
        });
        expect(store.getAnnouncementsForVendor('100')).toEqual(['Talk at 4 PM']);
        expect(store.toJSON()).toEqual({
            vendors: [{
                vendorId: '100',
                descriptionOverride: 'Try the terminal wall.',
                featuredItems: ['ADM-3A', 'VT100'],
                announcements: ['Talk at 4 PM'],
                clueText: 'Ask about the serial adapter.',
                moderationStatus: 'approved'
            }],
            announcements: [{
                vendorId: '100',
                announcements: ['Talk at 4 PM']
            }]
        });

        store.applyUpdate({ vendorId: '100' });

        expect(store.getContentForVendor('100')).toMatchObject({
            descriptionOverride: '',
            featuredItems: [],
            announcements: []
        });
        expect(store.toJSON()).toEqual({ vendors: [], announcements: [] });
    });
});
