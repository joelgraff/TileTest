import { describe, expect, it } from 'vitest';

import {
    createVendorAnnouncementLines,
    createVendorClueLine,
    createVendorContentProfile,
    createVendorFeaturedItemLines,
    createVendorFactLines
} from '../../vendorContentProfile.js';

describe('vendor content profile', () => {
    it('normalizes vendor display content from vendor and domain data', () => {
        const profile = createVendorContentProfile({
            id: 'vendor-1',
            name: 'Vendor One',
            booth: 'A-12',
            description: 'Vintage systems and demos.',
            domain_id: 'retro',
            featuredItems: ['Static terminal demo'],
            announcements: ['Demo at 2 PM'],
            clueText: 'Static clue.',
            dialog: {
                responses: [
                    { text: 'Show me your inventory', action: 'show_items' },
                    { text: 'Goodbye', action: 'end' },
                    { text: '', action: 'broken' }
                ]
            }
        }, {
            domainName: 'Retro Computing',
            items: [
                { id: 'item-1', name: 'Apple II', value: 100 },
                { id: 'broken' }
            ],
            facts: ['The Apple II launched in 1977.'],
            announcements: [{ text: 'Ask about restoration notes.' }],
            descriptionOverride: 'Hands-on restoration bench.',
            featuredItems: [{ name: 'Kaypro II' }],
            clueText: 'Ask about CP/M disks.',
            moderationStatus: 'needs_review'
        });

        expect(profile).toMatchObject({
            id: 'vendor-1',
            name: 'Vendor One',
            booth: 'A-12',
            description: 'Hands-on restoration bench.',
            descriptionOverride: 'Hands-on restoration bench.',
            domainId: 'retro',
            domainName: 'Retro Computing',
            clueText: 'Ask about CP/M disks.',
            moderationStatus: 'needs_review'
        });
        expect(profile.items.map(item => item.name)).toEqual(['Apple II']);
        expect(profile.facts).toEqual(['The Apple II launched in 1977.']);
        expect(profile.featuredItems).toEqual(['Static terminal demo', 'Kaypro II']);
        expect(profile.announcements).toEqual(['Demo at 2 PM', 'Ask about restoration notes.']);
        expect(profile.responses.map(response => response.action)).toEqual(['show_items', 'end']);
        expect(profile.exitResponse).toEqual({ text: 'Goodbye', action: 'end' });
        expect(createVendorFactLines(profile)).toEqual(['• The Apple II launched in 1977.']);
        expect(createVendorFeaturedItemLines(profile)).toEqual(['• Static terminal demo', '• Kaypro II']);
        expect(createVendorAnnouncementLines(profile)).toEqual(['• Demo at 2 PM', '• Ask about restoration notes.']);
        expect(createVendorClueLine(profile)).toBe('Ask about CP/M disks.');
    });

    it('provides safe display fallbacks for incomplete vendor content', () => {
        const profile = createVendorContentProfile({}, {
            domainName: '',
            items: null,
            facts: null,
            announcements: null,
            featuredItems: null,
            moderationStatus: 'invalid-status'
        });

        expect(profile.name).toBe('Unknown Vendor');
        expect(profile.booth).toBe('Unknown Booth');
        expect(profile.description).toBe('No description available.');
        expect(profile.domainName).toBe('Unknown Domain');
        expect(profile.items).toEqual([]);
        expect(profile.facts).toEqual([]);
        expect(profile.featuredItems).toEqual([]);
        expect(profile.announcements).toEqual([]);
        expect(profile.clueText).toBe('');
        expect(profile.moderationStatus).toBe('approved');
        expect(profile.responses).toEqual([]);
        expect(profile.exitResponse).toBeNull();
    });
});