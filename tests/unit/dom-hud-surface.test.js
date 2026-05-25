import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createDomHelpHudButton,
    createDomInventoryHudButton,
    createDomQuestHudButton,
    createDomScoreHud,
    createDomUiHud,
    createDomVersionHud,
    supportsDomHud
} from '../../domHudSurface.js';

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

function createUiManager() {
    return {
        score: 42,
        inputManager: {
            prepareUiInteraction: vi.fn()
        },
        toggleInventory: vi.fn(),
        toggleQuests: vi.fn(),
        toggleHelp: vi.fn()
    };
}

describe('dom hud surface', () => {
    const originalDocument = globalThis.document;

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    it('detects overlay support and renders the full HUD into the overlay root', () => {
        const { documentRef, overlayRoot } = createFakeDocument();
        const uiManager = createUiManager();

        globalThis.document = documentRef;

        expect(supportsDomHud()).toBe(true);

        const returned = createDomUiHud(uiManager);

        expect(returned).toBe(uiManager);
        expect(overlayRoot.children).toHaveLength(1);
        expect(uiManager.domHudRoot.dataset.uiSurface).toBe('hud');
        expect(uiManager.helpButton.dataset.hudControl).toBe('help');
        expect(uiManager.invButton.dataset.hudControl).toBe('inventory');
        expect(uiManager.questButton.dataset.hudControl).toBe('quests');
        expect(uiManager.versionText.textContent).toBe('Version 1.6');
        expect(uiManager.scoreBackground.dataset.hudScore).toBe('true');
    });

    it('updates the score label through the stable scoreText adapter', () => {
        const { documentRef } = createFakeDocument();
        const uiManager = createUiManager();

        globalThis.document = documentRef;

        createDomScoreHud(uiManager);
        uiManager.scoreText.setText('SCORE: 99');

        expect(uiManager.scoreTextElement.textContent).toBe('SCORE: 99');
    });

    it('routes DOM HUD button clicks through the same interaction contracts', () => {
        const { documentRef } = createFakeDocument();
        const uiManager = createUiManager();

        globalThis.document = documentRef;

        createDomInventoryHudButton(uiManager);
        createDomQuestHudButton(uiManager);
        createDomHelpHudButton(uiManager);
        createDomVersionHud(uiManager);

        uiManager.invButton.emit('click');
        uiManager.questButton.emit('click');
        uiManager.helpButton.emit('click');

        expect(uiManager.inputManager.prepareUiInteraction).toHaveBeenCalledTimes(2);
        expect(uiManager.toggleInventory).toHaveBeenCalledTimes(1);
        expect(uiManager.toggleQuests).toHaveBeenCalledTimes(1);
        expect(uiManager.toggleHelp).toHaveBeenCalledTimes(1);
        expect(uiManager.versionText.dataset.hudVersion).toBe('true');
    });
});