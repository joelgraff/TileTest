import { describe, expect, it, vi } from 'vitest';

import {
    createHelpHudButton,
    createInventoryHudButton,
    createQuestHudButton,
    createScoreHud,
    createUiHud,
    createVersionHud
} from '../../uiHudFactory.js';

function createRectangle() {
    const handlers = new Map();

    return {
        handlers,
        setScrollFactor: vi.fn(function () { return this; }),
        setDepth: vi.fn(function () { return this; }),
        setStrokeStyle: vi.fn(function () { return this; }),
        setInteractive: vi.fn(function () { return this; }),
        setFillStyle: vi.fn(function () { return this; }),
        on: vi.fn(function (eventName, handler) {
            handlers.set(eventName, handler);
            return this;
        })
    };
}

function createText() {
    return {
        setOrigin: vi.fn(function () { return this; }),
        setScrollFactor: vi.fn(function () { return this; }),
        setDepth: vi.fn(function () { return this; })
    };
}

function createUiManager() {
    const rectangles = [];
    const texts = [];

    const uiManager = {
        score: 42,
        colors: {
            button: 0x808080,
            buttonHover: 0xC0C0C0
        },
        inputManager: {
            prepareUiInteraction: vi.fn()
        },
        toggleInventory: vi.fn(),
        toggleQuests: vi.fn(),
        toggleHelp: vi.fn(),
        scene: {
            add: {
                rectangle: vi.fn(() => {
                    const rectangle = createRectangle();
                    rectangles.push(rectangle);
                    return rectangle;
                }),
                text: vi.fn(() => {
                    const text = createText();
                    texts.push(text);
                    return text;
                })
            }
        }
    };

    return {
        uiManager,
        rectangles,
        texts
    };
}

describe('UI HUD factory', () => {
    it('creates the score and version HUD surfaces with the current score text', () => {
        const { uiManager, texts } = createUiManager();

        createScoreHud(uiManager);
        createVersionHud(uiManager);

        expect(uiManager.scene.add.rectangle).toHaveBeenCalledWith(100, 25, 180, 40, uiManager.colors.button);
        expect(uiManager.scene.add.text).toHaveBeenNthCalledWith(1, 100, 25, 'SCORE: 42', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            fill: '#FFFFFF',
            align: 'center'
        });
        expect(uiManager.scene.add.text).toHaveBeenNthCalledWith(2, 10, 620, 'Version 1.6', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'left'
        });
        expect(texts[0].setOrigin).toHaveBeenCalledWith(0.5);
        expect(texts[1].setOrigin).toHaveBeenCalledWith(0);
    });

    it('preserves inventory and quest button hover and pointerdown contracts', () => {
        const { uiManager } = createUiManager();

        createInventoryHudButton(uiManager);
        createQuestHudButton(uiManager);

        const inventoryEvent = { stopPropagation: vi.fn() };
        const questEvent = { stopPropagation: vi.fn() };

        uiManager.invButton.handlers.get('pointerover')();
        uiManager.invButton.handlers.get('pointerout')();
        uiManager.invButton.handlers.get('pointerdown')(null, null, null, inventoryEvent);

        uiManager.questButton.handlers.get('pointerover')();
        uiManager.questButton.handlers.get('pointerout')();
        uiManager.questButton.handlers.get('pointerdown')(null, null, null, questEvent);

        expect(uiManager.invButton.setFillStyle).toHaveBeenNthCalledWith(1, uiManager.colors.buttonHover);
        expect(uiManager.invButton.setFillStyle).toHaveBeenNthCalledWith(2, uiManager.colors.button);
        expect(inventoryEvent.stopPropagation).toHaveBeenCalledTimes(1);
        expect(uiManager.inputManager.prepareUiInteraction).toHaveBeenCalledTimes(2);
        expect(uiManager.toggleInventory).toHaveBeenCalledTimes(1);

        expect(uiManager.questButton.setFillStyle).toHaveBeenNthCalledWith(1, uiManager.colors.buttonHover);
        expect(uiManager.questButton.setFillStyle).toHaveBeenNthCalledWith(2, uiManager.colors.button);
        expect(questEvent.stopPropagation).toHaveBeenCalledTimes(1);
        expect(uiManager.toggleQuests).toHaveBeenCalledTimes(1);
    });

    it('keeps the help button pointerdown contract separate from UI input preparation', () => {
        const { uiManager } = createUiManager();

        createHelpHudButton(uiManager);

        const helpEvent = { stopPropagation: vi.fn() };
        uiManager.helpButton.handlers.get('pointerdown')(null, null, null, helpEvent);

        expect(helpEvent.stopPropagation).toHaveBeenCalledTimes(1);
        expect(uiManager.toggleHelp).toHaveBeenCalledTimes(1);
        expect(uiManager.inputManager.prepareUiInteraction).not.toHaveBeenCalled();
    });

    it('builds the full HUD in one pass', () => {
        const { uiManager } = createUiManager();

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