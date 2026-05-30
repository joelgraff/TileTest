import { describe, expect, it, vi } from 'vitest';

import CONFIG from '../../config.js';
import { renderDomDialogSurface } from '../../domDialogSurface.js';

function createFakeDocument() {
    class FakeElement {
        constructor(tagName, ownerDocument) {
            this.tagName = tagName;
            this.ownerDocument = ownerDocument;
            this.children = [];
            this.dataset = {};
            this.attributes = {};
            this.listeners = new Map();
            this.parentNode = null;
            this.className = '';
            this.textContent = '';
            this.type = undefined;
        }

        append(...children) {
            children.filter(Boolean).forEach(child => {
                child.parentNode = this;
                this.children.push(child);
            });

            return this;
        }

        setAttribute(name, value) {
            this.attributes[name] = value;
        }

        addEventListener(type, listener) {
            const listeners = this.listeners.get(type) ?? [];
            listeners.push(listener);
            this.listeners.set(type, listeners);
        }

        emit(type, event = {}) {
            const listeners = this.listeners.get(type) ?? [];

            listeners.forEach(listener => {
                listener({
                    preventDefault: vi.fn(),
                    stopPropagation: vi.fn(),
                    ...event
                });
            });
        }

        remove() {
            if (!this.parentNode) {
                return;
            }

            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
            this.parentNode = null;
        }
    }

    const elementsById = new Map();
    const documentRef = {
        createElement: (tagName) => new FakeElement(tagName, documentRef),
        getElementById: (id) => elementsById.get(id) ?? null
    };
    const overlayRoot = new FakeElement('div', documentRef);

    elementsById.set('ui-overlay-root', overlayRoot);

    return {
        documentRef,
        overlayRoot
    };
}

describe('dom dialog surface', () => {
    it('renders a dialog into the overlay root and wires dismissal buttons', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const onClose = vi.fn();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            title: 'Help',
            text: 'Controls:\nSpacebar',
            exitButton: {
                label: 'Close',
                onClick: onClose
            }
        }, { documentRef });

        expect(dialogRoot).toBe(overlayRoot.children[0]);
        expect(dialogRoot.dataset.dialogSurface).toBe('dom');
        expect(dialogRoot.children[0].attributes.role).toBe('dialog');
        expect(dialogRoot.children[0].children[0].textContent).toBe('Help');
        expect(dialogRoot.children[0].children[1].textContent).toBe('Controls:\nSpacebar');

        const closeButton = dialogRoot.children[0].children[2].children[0];
        closeButton.emit('click');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('falls back cleanly when the overlay root is unavailable', () => {
        const documentRef = {
            createElement: vi.fn(),
            getElementById: vi.fn(() => null)
        };

        const result = renderDomDialogSurface({}, { title: 'Help' }, { documentRef });

        expect(result).toBe(null);
        expect(documentRef.createElement).not.toHaveBeenCalled();
    });

    it('marks disabled pagination buttons as non-interactive', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const onClick = vi.fn();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            title: 'Paged Dialog',
            text: 'Page 1',
            buttons: [{ label: '<', disabled: true, onClick }]
        }, { documentRef });

        const disabledButton = dialogRoot.children[0].children[2].children[0];

        expect(disabledButton.disabled).toBe(true);

        disabledButton.emit('click');

        expect(onClick).not.toHaveBeenCalled();
    });

    it('dismisses a dialog when the backdrop is clicked', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const onClose = vi.fn();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            title: 'Help',
            text: 'Controls',
            exitButton: {
                label: 'Close',
                onClick: onClose
            }
        }, { documentRef });

        dialogRoot.emit('click');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders a dialog portrait when imageKey is provided', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            imageKey: 'npc1',
            title: 'Vendor One',
            text: 'Vintage systems and demos.'
        }, { documentRef });

        const dialogPanel = dialogRoot.children[0];
        const contentRow = dialogPanel.children[1];
        const imageElement = contentRow.children[0].children[0];

        expect(contentRow.className).toBe('dom-dialog-content');
        expect(imageElement.tagName).toBe('img');
        expect(imageElement.className).toBe('dom-dialog-image');
        expect(imageElement.src).toBe(
            `${CONFIG.PATHS.ASSETS}/${CONFIG.NPC.SPRITES[0]}${CONFIG.PATHS.IMAGE_EXTENSION}`
        );
        expect(imageElement.alt).toBe('Vendor One portrait');
        expect(contentRow.children[1].textContent).toBe('Vintage systems and demos.');
    });

    it('renders vendor item buttons in a dedicated grid above the action bar', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            imageKey: 'npc1',
            title: 'Vendor Items',
            text: 'Available items from Retro Computing (Page 1/2):',
            itemButtons: [
                { label: 'Item One', onClick: vi.fn() },
                { label: 'Item Two', onClick: vi.fn() },
                { label: 'Item Three', onClick: vi.fn() }
            ],
            bottomButtons: [{ label: '>', disabled: false, onClick: vi.fn() }],
            exitButton: { label: 'Back', onClick: vi.fn() }
        }, { documentRef });

        const dialogPanel = dialogRoot.children[0];
        const contentRow = dialogPanel.children[1];
        const bodyElement = contentRow.children[1];
        const itemList = bodyElement.children[1];
        const actionBar = dialogPanel.children[2];

        expect(contentRow.className).toContain('dom-dialog-content');
        expect(contentRow.className).toContain('dom-dialog-content-with-items');
        expect(bodyElement.className).toContain('dom-dialog-body');
        expect(bodyElement.className).toContain('dom-dialog-body-centered');
        expect(itemList.className).toBe('dom-dialog-item-list');
        expect(itemList.children).toHaveLength(3);
        expect(itemList.children[0].className).toContain('dom-dialog-item-button');
        expect(actionBar.className).toBe('dom-dialog-actions');
        expect(actionBar.children).toHaveLength(2);
    });

    it('keeps the dialog open when clicks stay inside the panel', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const hideDialog = vi.fn();
        const stopPropagation = vi.fn();
        const manager = {
            getOverlayRoot: () => overlayRoot,
            hideDialog,
            handleTextPagination: vi.fn(text => text),
            handleButtonPagination: vi.fn(buttons => buttons),
            handleBottomButtonPagination: vi.fn(buttons => buttons)
        };

        const dialogRoot = renderDomDialogSurface(manager, {
            title: 'Help',
            text: 'Controls'
        }, { documentRef });

        const dialogPanel = dialogRoot.children[0];

        dialogPanel.emit('click', { stopPropagation });

        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(hideDialog).not.toHaveBeenCalled();
    });
});