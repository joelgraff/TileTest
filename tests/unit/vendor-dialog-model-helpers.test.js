import { describe, expect, it, vi } from 'vitest';

import {
    createVendorBoothInfoDialogData,
    createVendorContinueDialogData,
    createVendorExitButton,
    createVendorFactsDialogData,
    createVendorItemsDialogData,
    createVendorMessageDialogData,
    createVendorResponseButtons,
    createVendorReturnButton,
    createVendorRootDialogData
} from '../../vendorDialogModels.js';

describe('vendor dialog model helpers', () => {
    it('builds return, message, and continue dialog models from callbacks', () => {
        const showDialog = vi.fn();
        const onContinue = vi.fn();
        const dialogData = { title: 'Root' };
        const returnButton = createVendorReturnButton(dialogData, { showDialog });
        const messageDialog = createVendorMessageDialogData('Hello', { returnButton });
        const continueDialog = createVendorContinueDialogData('Next', { onContinue });

        expect(messageDialog).toEqual({
            renderMode: 'dom',
            text: 'Hello',
            buttons: [returnButton]
        });
        expect(continueDialog).toEqual({
            renderMode: 'dom',
            text: 'Next',
            buttons: [{
                label: 'Continue',
                onClick: onContinue
            }]
        });

        returnButton.onClick();

        expect(showDialog).toHaveBeenCalledWith(dialogData);
    });

    it('builds booth, facts, items, response, exit, and root dialog models from pure inputs', () => {
        const closeDialog = vi.fn();
        const handleVendorResponse = vi.fn();
        const vendorData = {
            name: 'Vendor One',
            description: 'Vintage systems and demos.',
            booth: 'A-12',
            dialog: {
                responses: [
                    { text: 'Show me your inventory', action: 'show_items' },
                    { text: 'Tell me about your booth', action: 'booth_info' },
                    { text: 'Goodbye', action: 'end' }
                ]
            }
        };
        const originalDialogData = { title: 'Root' };
        const returnButton = { label: 'Back', onClick: vi.fn() };
        const exitButton = createVendorExitButton(vendorData, { closeDialog });
        const responseButtons = createVendorResponseButtons(vendorData, {
            imageKey: 'npc1',
            originalDialogData,
            handleVendorResponse
        });
        const boothDialog = createVendorBoothInfoDialogData(vendorData, 'npc1', {
            domainName: 'Retro Computing',
            returnButton
        });
        const factsDialog = createVendorFactsDialogData(vendorData, 'npc1', {
            formattedFacts: ['• Fact one'],
            exitButton: returnButton
        });
        const itemsDialog = createVendorItemsDialogData(vendorData, 'npc1', {
            page: 1,
            totalPages: 3,
            domainName: 'Retro Computing',
            itemButtons: [{ label: 'Item One', onClick: vi.fn() }],
            bottomButtons: [{ label: '<', disabled: false, onClick: vi.fn() }],
            exitButton: returnButton
        });
        const rootDialog = createVendorRootDialogData(vendorData, {
            imageKey: 'npc1',
            buttons: responseButtons,
            exitButton
        });

        expect(boothDialog.text).toContain('Domain: Retro Computing');
        expect(boothDialog.renderMode).toBe('dom');
        expect(factsDialog.textPagination).toEqual({
            currentPage: 0,
            text: ['• Fact one']
        });
        expect(factsDialog.renderMode).toBe('dom');
        expect(itemsDialog.text).toBe('Available items from Retro Computing (Page 2/3):');
        expect(itemsDialog.renderMode).toBe('dom');
        expect(rootDialog).toMatchObject({
            renderMode: 'dom',
            imageKey: 'npc1',
            title: 'Vendor One',
            text: 'Vintage systems and demos.',
            exitButton
        });
        expect(responseButtons.map((button) => button.label)).toEqual(['Show me your inventory']);

        responseButtons[0].onClick();
        exitButton.onClick();

        expect(handleVendorResponse).toHaveBeenCalledWith(
            vendorData.dialog.responses[0],
            vendorData,
            'npc1',
            originalDialogData
        );
        expect(closeDialog).toHaveBeenCalledTimes(1);
    });
});