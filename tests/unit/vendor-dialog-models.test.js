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

    it('builds a root dialog with filtered responses and an exit action', () => {
        const uiManager = {
            closeDialog: vi.fn()
        };
        const context = {
            uiManager,
            createVendorExitButton: VendorManager.prototype.createVendorExitButton,
            createVendorResponseButtons: VendorManager.prototype.createVendorResponseButtons,
            handleVendorResponse: vi.fn(),
            buildVendorRootDialogData: VendorManager.prototype.buildVendorRootDialogData
        };
        const vendorData = {
            name: 'Vendor One',
            description: 'Vintage systems and demos.',
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
            imageKey: 'npc1',
            title: 'Vendor One',
            text: 'Vintage systems and demos.'
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

        expect(uiManager.closeDialog).toHaveBeenCalledTimes(1);
    });

    it('builds an item fallback dialog when a vendor has no domain items', () => {
        const uiManager = {
            showDialog: vi.fn(),
            collectVendorItem: vi.fn()
        };
        const originalDialogData = { title: 'Vendor Root' };
        const context = {
            uiManager,
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

        expect(dialogData.text).toBe('No items available at this time.');
        expect(dialogData.buttons).toHaveLength(1);

        dialogData.buttons[0].onClick();

        expect(uiManager.showDialog).toHaveBeenCalledWith(originalDialogData);
        expect(uiManager.collectVendorItem).not.toHaveBeenCalled();
    });
});