import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DomainManager from '../../domainManager.js';
import VendorManager from '../../vendorManager.js';

describe('VendorManager dialog models', () => {
    let originalDomains;

    beforeEach(() => {
        originalDomains = DomainManager.domains;
        DomainManager.domains = [{
            id: 'retro',
            name: 'Retro Computing',
            items: [],
            facts: []
        }];
    });

    afterEach(() => {
        DomainManager.domains = originalDomains;
        vi.restoreAllMocks();
    });

    it('builds a root dialog with filtered responses and authored content sections', () => {
        const closeDialog = vi.fn();
        const context = {
            closeDialog,
            createVendorExitButton: VendorManager.prototype.createVendorExitButton,
            createVendorResponseButtons: VendorManager.prototype.createVendorResponseButtons,
            handleVendorResponse: vi.fn(),
            buildVendorRootDialogData: VendorManager.prototype.buildVendorRootDialogData
        };
        const vendorData = {
            name: 'Vendor One',
            description: 'Vintage systems and demos.',
            featuredItems: ['Portable demo'],
            clueText: 'Ask about serial cables.',
            dialog: {
                responses: [
                    { text: 'Show me your inventory', action: 'show_items' },
                    { text: 'Tell me about your booth', action: 'booth_info' },
                    { text: 'Goodbye', action: 'end' }
                ]
            }
        };

        const dialogData = VendorManager.prototype.buildVendorRootDialogData.call(context, vendorData, 'npc1');

        expect(dialogData).toMatchObject({
            renderMode: 'dom',
            imageKey: 'npc1',
            title: 'Vendor One',
            text: 'Vintage systems and demos.\n\nFeatured:\n• Portable demo\n\nClue: Ask about serial cables.'
        });
        expect(dialogData.buttons.map(button => button.label)).toEqual(['Show me your inventory']);

        dialogData.buttons[0].onClick();

        expect(context.handleVendorResponse).toHaveBeenCalledWith(
            vendorData.dialog.responses[0],
            vendorData,
            'npc1',
            dialogData
        );

        dialogData.exitButton.onClick();

        expect(closeDialog).toHaveBeenCalledTimes(1);
    });

    it('merges live vendor content through vendor content profiles', () => {
        const liveContentService = {
            getContentForVendor: vi.fn(() => ({
                descriptionOverride: 'Live restoration bench.',
                featuredItems: ['Disk imaging demo'],
                announcements: ['Repair clinic starts at 3 PM'],
                clueText: 'Ask for the live passport clue.'
            }))
        };
        const context = {
            liveContentService,
            getLiveAnnouncementsForVendor: VendorManager.prototype.getLiveAnnouncementsForVendor,
            getLiveContentForVendor: VendorManager.prototype.getLiveContentForVendor,
            getVendorContentProfile: VendorManager.prototype.getVendorContentProfile,
            getRandomFacts: VendorManager.prototype.getRandomFacts
        };
        const vendorData = {
            id: 'vendor-1',
            name: 'Vendor One',
            booth: 'A-12',
            description: 'Vintage systems and demos.',
            domain_id: 'retro',
            announcements: ['Static demo at noon']
        };

        const profile = VendorManager.prototype.getVendorContentProfile.call(context, vendorData);

        expect(liveContentService.getContentForVendor).toHaveBeenCalledWith('vendor-1');
        expect(profile.description).toBe('Live restoration bench.');
        expect(profile.featuredItems).toEqual(['Disk imaging demo']);
        expect(profile.announcements).toEqual([
            'Static demo at noon',
            'Repair clinic starts at 3 PM'
        ]);
        expect(profile.clueText).toBe('Ask for the live passport clue.');
    });

    it('builds an item fallback dialog when a vendor has no domain items', () => {
        const showDialog = vi.fn();
        const collectVendorItem = vi.fn();
        const originalDialogData = { title: 'Vendor Root' };
        const context = {
            showDialog,
            collectVendorItem,
            createReturnButton: VendorManager.prototype.createReturnButton,
            buildVendorMessageDialogData: VendorManager.prototype.buildVendorMessageDialogData,
            buildVendorItemsDialogData: VendorManager.prototype.buildVendorItemsDialogData
        };
        const vendorData = {
            id: 'vendor-1',
            name: 'Vendor One',
            domain_id: 'retro'
        };

        const dialogData = VendorManager.prototype.buildVendorItemsDialogData.call(context, vendorData, 'npc1', originalDialogData, 0);

        expect(dialogData.renderMode).toBe('dom');
        expect(dialogData.text).toBe('No items available at this time.');
        expect(dialogData.buttons).toHaveLength(1);

        dialogData.buttons[0].onClick();

        expect(showDialog).toHaveBeenCalledWith(originalDialogData);
        expect(collectVendorItem).not.toHaveBeenCalled();
    });

    it('adds passport feedback to the vendor root dialog only for newly earned stamps', () => {
        const showDialog = vi.fn();
        const vendorData = {
            id: 'vendor-1',
            name: 'Vendor One',
            description: 'Vintage systems and demos.',
            domain_id: 'retro',
            dialog: {
                responses: [
                    { text: 'Show me your inventory', action: 'show_items' },
                    { text: 'Goodbye', action: 'end' }
                ]
            }
        };
        const vendorContent = {
            ...vendorData,
            booth: 'A1',
            domainName: 'Retro Computing',
            featuredItems: [],
            announcements: [],
            clueText: '',
            responses: vendorData.dialog.responses,
            exitResponse: vendorData.dialog.responses[1]
        };
        const context = {
            showDialog,
            closeDialog: vi.fn(),
            interactionPrompt: { setVisible: vi.fn() },
            getVendorImageKey: VendorManager.prototype.getVendorImageKey,
            getVendorContentProfile: vi.fn(() => vendorContent),
            buildVendorRootDialogData: VendorManager.prototype.buildVendorRootDialogData,
            createVendorExitButton: VendorManager.prototype.createVendorExitButton,
            createVendorResponseButtons: VendorManager.prototype.createVendorResponseButtons,
            handleVendorResponse: vi.fn(),
            markVendorDiscovery: vi.fn(() => ({
                updated: true,
                questCompleted: false,
                message: 'Passport stamp earned: Vendor One (A1)\nDiscovery Passport progress: 1/2 vendors visited.'
            })),
            showVendorDiscoveryFeedback: VendorManager.prototype.showVendorDiscoveryFeedback,
            buildVendorDiscoveryFeedbackText: VendorManager.prototype.buildVendorDiscoveryFeedbackText,
            withVendorDiscoveryFeedback: VendorManager.prototype.withVendorDiscoveryFeedback
        };

        expect(VendorManager.prototype.interactWithVendor.call(context, vendorData)).toBe(true);

        expect(showDialog).toHaveBeenCalledTimes(2);
        expect(showDialog.mock.calls[1][0].text).toContain('Passport stamp earned: Vendor One (A1)');
        expect(showDialog.mock.calls[1][0].text).toContain('Vintage systems and demos.');

        showDialog.mockClear();
        context.markVendorDiscovery.mockReturnValue({
            updated: false,
            questCompleted: false,
            message: ''
        });

        expect(VendorManager.prototype.interactWithVendor.call(context, vendorData)).toBe(true);

        expect(showDialog).toHaveBeenCalledTimes(1);
        expect(showDialog.mock.calls[0][0].text).not.toContain('Passport stamp earned');
    });

    it('surfaces ordered encounter lock feedback through the vendor dialog path', () => {
        const feedback = VendorManager.prototype.buildVendorDiscoveryFeedbackText({
            updated: false,
            blocked: true,
            message: 'Vendor Two is locked. Complete Vendor One first.'
        });

        expect(feedback).toBe('Vendor Two is locked. Complete Vendor One first.');
    });
});