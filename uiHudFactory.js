import {
    createDomHelpHudButton,
    createDomInventoryHudButton,
    createDomQuestHudButton,
    createDomScoreHud,
    createDomUiHud,
    createDomVersionHud,
    supportsDomHud
} from './domHudSurface.js';

function configureHudRectangle(rectangle) {
    return rectangle
        .setScrollFactor(0)
        .setDepth(100)
        .setStrokeStyle(2, 0xFFFFFF);
}

function configureHudText(text) {
    return text
        .setScrollFactor(0)
        .setDepth(101);
}

function createHudButton(uiManager, key, { x, y, label, onClick, preparesUiInteraction = false }) {
    const button = configureHudRectangle(
        uiManager.scene.add.rectangle(x, y, 80, 30, uiManager.colors.button)
    ).setInteractive({ cursor: 'pointer' });

    const buttonText = configureHudText(
        uiManager.scene.add.text(x, y, label, {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
    ).setOrigin(0.5);

    button.on('pointerover', () => {
        button.setFillStyle(uiManager.colors.buttonHover);
    });

    button.on('pointerout', () => {
        button.setFillStyle(uiManager.colors.button);
    });

    button.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();

        if (preparesUiInteraction) {
            uiManager.inputManager?.prepareUiInteraction?.();
        }

        onClick();
    });

    uiManager[`${key}Button`] = button;
    uiManager[`${key}ButtonText`] = buttonText;

    return { button, buttonText };
}

export function createScoreHud(uiManager) {
    if (supportsDomHud()) {
        return createDomScoreHud(uiManager);
    }

    uiManager.scoreBackground = configureHudRectangle(
        uiManager.scene.add.rectangle(100, 25, 180, 40, uiManager.colors.button)
    );

    uiManager.scoreText = configureHudText(
        uiManager.scene.add.text(100, 25, `SCORE: ${uiManager.score}`, {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            fill: '#FFFFFF',
            align: 'center'
        })
    ).setOrigin(0.5);

    return {
        scoreBackground: uiManager.scoreBackground,
        scoreText: uiManager.scoreText
    };
}

export function createInventoryHudButton(uiManager) {
    if (supportsDomHud()) {
        return createDomInventoryHudButton(uiManager);
    }

    return createHudButton(uiManager, 'inv', {
        x: 720,
        y: 60,
        label: 'PACK',
        preparesUiInteraction: true,
        onClick: () => {
            uiManager.toggleInventory();
        }
    });
}

export function createQuestHudButton(uiManager) {
    if (supportsDomHud()) {
        return createDomQuestHudButton(uiManager);
    }

    return createHudButton(uiManager, 'quest', {
        x: 720,
        y: 25,
        label: 'QUESTS',
        preparesUiInteraction: true,
        onClick: () => {
            uiManager.toggleQuests();
        }
    });
}

export function createHelpHudButton(uiManager) {
    if (supportsDomHud()) {
        return createDomHelpHudButton(uiManager);
    }

    return createHudButton(uiManager, 'help', {
        x: 10,
        y: 60,
        label: 'HELP',
        onClick: () => {
            uiManager.toggleHelp();
        }
    });
}

export function createVersionHud(uiManager) {
    if (supportsDomHud()) {
        return createDomVersionHud(uiManager);
    }

    uiManager.versionText = uiManager.scene.add.text(10, 620, 'Version 1.6', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fill: '#FFFFFF',
        align: 'left'
    })
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100);

    return uiManager.versionText;
}

export function createUiHud(uiManager) {
    if (supportsDomHud()) {
        return createDomUiHud(uiManager);
    }

    createScoreHud(uiManager);
    createInventoryHudButton(uiManager);
    createQuestHudButton(uiManager);
    createHelpHudButton(uiManager);
    createVersionHud(uiManager);

    return uiManager;
}