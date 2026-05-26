import { describe, expect, it, vi } from 'vitest';

import DialogManager from '../../dialogManager.js';

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

describe('DialogManager interaction state', () => {
    it('clears movement through the injected InputManager when a dialog opens', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const originalDocument = globalThis.document;
        const prepareUiInteraction = vi.fn();
        const context = {
            isDialogOpen: false,
            scene: {
                isDialogOpen: false,
            },
            prepareUiInteraction,
            getOverlayRoot: () => overlayRoot
        };

        globalThis.document = documentRef;

        const dialogRoot = DialogManager.prototype.showDialog.call(context, { text: 'Test dialog' });

        globalThis.document = originalDocument;

        expect(prepareUiInteraction).toHaveBeenCalledTimes(1);
        expect(context.isDialogOpen).toBe(true);
        expect(context.scene.isDialogOpen).toBe(true);
        expect(dialogRoot).toBe(overlayRoot.children[0]);
        expect(context.domDialogRoot).toBe(dialogRoot);
    });

    it('suppresses pointer movement through InputManager when a dialog closes mid-click', () => {
        const prepareUiInteraction = vi.fn();
        const domDialogRoot = { remove: vi.fn() };
        const context = {
            isDialogOpen: true,
            scene: {
                isDialogOpen: true,
            },
            prepareUiInteraction,
            isPointerDown: () => true,
            inputManager: {
                prepareUiInteraction
            },
            domDialogRoot
        };

        DialogManager.prototype.hideDialog.call(context);

        expect(context.isDialogOpen).toBe(false);
        expect(context.scene.isDialogOpen).toBe(false);
        expect(prepareUiInteraction).toHaveBeenCalledWith({ suppressPointer: true });
        expect(domDialogRoot.remove).toHaveBeenCalledTimes(1);
        expect(context.domDialogRoot).toBe(null);
    });

    it('releases pointer suppression when a dialog closes after the pointer is already up', () => {
        const prepareUiInteraction = vi.fn();
        const releasePointerSuppression = vi.fn();
        const context = {
            isDialogOpen: true,
            scene: {
                isDialogOpen: true
            },
            prepareUiInteraction,
            releasePointerSuppression,
            isPointerDown: () => false,
            inputManager: {
                prepareUiInteraction,
                releasePointerSuppression
            }
        };

        DialogManager.prototype.hideDialog.call(context);

        expect(prepareUiInteraction).not.toHaveBeenCalled();
        expect(releasePointerSuppression).toHaveBeenCalledTimes(1);
    });
});