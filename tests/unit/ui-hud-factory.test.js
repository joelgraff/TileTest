import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createHelpHudButton,
    createInventoryHudButton,
    createQuestHudButton,
    createScoreHud,
    createUiHud,
    createVersionHud
} from '../../uiHudFactory.js';

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

function createUiManager() {
    const uiManager = {
        score: 42,
        inputManager: {
            prepareUiInteraction: vi.fn()
        },
        toggleInventory: vi.fn(),
        toggleQuests: vi.fn(),
        toggleHelp: vi.fn()
    };

    return { uiManager };
}

describe('UI HUD factory', () => {
    const originalDocument = globalThis.document;

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    it('creates the score and version HUD surfaces with the current score text', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const { uiManager } = createUiManager();

        globalThis.document = documentRef;

        createScoreHud(uiManager);
        createVersionHud(uiManager);

        expect(overlayRoot.children).toHaveLength(1);
        expect(uiManager.scoreBackground.dataset.hudScore).toBe('true');
        expect(uiManager.scoreTextElement.textContent).toBe('SCORE: 42');
        expect(uiManager.versionText.textContent).toBe('Version 1.6');
    });

    it('preserves inventory and quest button click contracts', () => {
        const { documentRef } = createFakeDocument();
        const { uiManager } = createUiManager();

        globalThis.document = documentRef;

        createInventoryHudButton(uiManager);
        createQuestHudButton(uiManager);

        uiManager.invButton.emit('click');
        uiManager.questButton.emit('click');

        expect(uiManager.inputManager.prepareUiInteraction).toHaveBeenCalledTimes(2);
        expect(uiManager.toggleInventory).toHaveBeenCalledTimes(1);
        expect(uiManager.toggleQuests).toHaveBeenCalledTimes(1);
    });

    it('keeps the help button click contract separate from UI input preparation', () => {
        const { documentRef } = createFakeDocument();
        const { uiManager } = createUiManager();

        globalThis.document = documentRef;

        createHelpHudButton(uiManager);

        uiManager.helpButton.emit('click');

        expect(uiManager.toggleHelp).toHaveBeenCalledTimes(1);
        expect(uiManager.inputManager.prepareUiInteraction).not.toHaveBeenCalled();
    });

    it('builds the full HUD in one pass', () => {
        const { documentRef } = createFakeDocument();
        const { uiManager } = createUiManager();

        globalThis.document = documentRef;

        const returned = createUiHud(uiManager);

        expect(returned).toBe(uiManager);
        expect(uiManager.scoreBackground).toBeTruthy();
        expect(uiManager.scoreText).toBeTruthy();
        expect(uiManager.invButton).toBeTruthy();
        expect(uiManager.questButton).toBeTruthy();
        expect(uiManager.helpButton).toBeTruthy();
        expect(uiManager.versionText).toBeTruthy();
    });
});