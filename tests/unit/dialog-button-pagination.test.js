import { describe, expect, it, vi } from 'vitest';

import DialogManager from '../../dialogManager.js';

describe('DialogManager button pagination', () => {
    it('slices button pages and appends navigation buttons through the public API', () => {
        const showDialog = vi.fn();
        const buttons = [
            { label: 'One' },
            { label: 'Two' },
            { label: 'Three' },
            { label: 'Four' },
            { label: 'Five' }
        ];
        const context = {
            currentDialogParams: {
                title: 'Paged Dialog',
                buttons,
                pagination: { currentPage: 0, itemsPerPage: 2 }
            },
            showDialog,
            getDialogParams: DialogManager.prototype.getDialogParams,
            getPaginationButtons: DialogManager.prototype.getPaginationButtons
        };

        const displayButtons = DialogManager.prototype.handleButtonPagination.call(
            context,
            buttons,
            { currentPage: 0, itemsPerPage: 2 }
        );

        expect(displayButtons.map(button => button.label)).toEqual(['One', 'Two', '<', '>']);
        expect(displayButtons[2].disabled).toBe(true);
        expect(displayButtons[3].disabled).toBe(false);

        displayButtons[3].onClick();

        expect(showDialog).toHaveBeenCalledWith({
            title: 'Paged Dialog',
            buttons,
            pagination: { currentPage: 1, itemsPerPage: 2 }
        });
    });

    it('appends text pagination controls to bottom buttons and preserves existing buttons', () => {
        const showDialog = vi.fn();
        const text = Array.from({ length: 9 }, (_, index) => `Fact ${index + 1} with enough text to consume pagination space.`);
        const bottomButtons = [{ label: 'Close' }];
        const context = {
            currentDialogParams: {
                title: 'Facts Dialog'
            },
            showDialog,
            getDialogParams: DialogManager.prototype.getDialogParams,
            calculateTextPages: DialogManager.prototype.calculateTextPages,
            getTextPaginationButtons: DialogManager.prototype.getTextPaginationButtons
        };

        const displayBottomButtons = DialogManager.prototype.handleBottomButtonPagination.call(
            context,
            bottomButtons,
            { currentPage: 0, text }
        );

        expect(displayBottomButtons.map(button => button.label)).toEqual(['Close', '<', '>']);
        expect(displayBottomButtons[1].disabled).toBe(true);
        expect(displayBottomButtons[2].disabled).toBe(false);

        displayBottomButtons[2].onClick();

        expect(showDialog).toHaveBeenCalledWith({
            title: 'Facts Dialog',
            textPagination: { currentPage: 1, text }
        });
    });
});