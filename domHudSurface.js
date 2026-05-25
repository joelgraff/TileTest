const VERSION_LABEL = 'Version 1.6';

export function supportsDomHud(documentRef = globalThis.document) {
    return Boolean(documentRef?.createElement && documentRef.getElementById?.('ui-overlay-root'));
}

function removeExistingElement(element) {
    element?.remove?.();
}

function createScoreTextAdapter(element) {
    return {
        setText(text) {
            element.textContent = text;
            return this;
        }
    };
}

function ensureHudRoot(uiManager, documentRef = globalThis.document) {
    if (uiManager.domHudRoot) {
        return uiManager.domHudRoot;
    }

    const overlayRoot = documentRef.getElementById('ui-overlay-root');
    if (!overlayRoot) {
        return null;
    }

    const hudRoot = documentRef.createElement('div');
    hudRoot.className = 'dom-hud';
    hudRoot.dataset.uiSurface = 'hud';

    const topBar = documentRef.createElement('div');
    topBar.className = 'dom-hud-topbar';

    const leftCluster = documentRef.createElement('div');
    leftCluster.className = 'dom-hud-section dom-hud-section--left';

    const centerCluster = documentRef.createElement('div');
    centerCluster.className = 'dom-hud-section dom-hud-section--center';

    const rightCluster = documentRef.createElement('div');
    rightCluster.className = 'dom-hud-section dom-hud-section--right';

    const bottomBar = documentRef.createElement('div');
    bottomBar.className = 'dom-hud-bottombar';

    hudRoot.append(topBar, bottomBar);
    topBar.append(leftCluster, centerCluster, rightCluster);
    overlayRoot.append(hudRoot);

    uiManager.domHudRoot = hudRoot;
    uiManager.domHudLeftCluster = leftCluster;
    uiManager.domHudCenterCluster = centerCluster;
    uiManager.domHudRightCluster = rightCluster;
    uiManager.domHudBottomBar = bottomBar;

    return hudRoot;
}

function createHudButtonElement(documentRef, label, { controlName, onClick, preparesUiInteraction, uiManager }) {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = 'dom-hud-button';
    button.dataset.hudControl = controlName;
    button.textContent = label;
    button.addEventListener('click', event => {
        event.preventDefault?.();
        event.stopPropagation?.();

        if (preparesUiInteraction) {
            uiManager.inputManager?.prepareUiInteraction?.();
        }

        onClick();
    });

    return button;
}

export function createDomScoreHud(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);

    removeExistingElement(uiManager.scoreBackground);

    const scoreBackground = documentRef.createElement('div');
    scoreBackground.className = 'dom-hud-score';
    scoreBackground.dataset.hudScore = 'true';

    const scoreLabel = documentRef.createElement('span');
    scoreLabel.className = 'dom-hud-score-text';
    scoreLabel.textContent = `SCORE: ${uiManager.score}`;

    scoreBackground.append(scoreLabel);
    uiManager.domHudCenterCluster.append(scoreBackground);

    uiManager.scoreBackground = scoreBackground;
    uiManager.scoreTextElement = scoreLabel;
    uiManager.scoreText = createScoreTextAdapter(scoreLabel);

    return {
        scoreBackground: uiManager.scoreBackground,
        scoreText: uiManager.scoreText
    };
}

export function createDomInventoryHudButton(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);

    removeExistingElement(uiManager.invButton);

    const button = createHudButtonElement(documentRef, 'PACK', {
        controlName: 'inventory',
        preparesUiInteraction: true,
        onClick: () => uiManager.toggleInventory(),
        uiManager
    });

    uiManager.domHudRightCluster.append(button);
    uiManager.invButton = button;

    return button;
}

export function createDomQuestHudButton(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);

    removeExistingElement(uiManager.questButton);

    const button = createHudButtonElement(documentRef, 'QUESTS', {
        controlName: 'quests',
        preparesUiInteraction: true,
        onClick: () => uiManager.toggleQuests(),
        uiManager
    });

    uiManager.domHudRightCluster.append(button);
    uiManager.questButton = button;

    return button;
}

export function createDomHelpHudButton(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);

    removeExistingElement(uiManager.helpButton);

    const button = createHudButtonElement(documentRef, 'HELP', {
        controlName: 'help',
        preparesUiInteraction: false,
        onClick: () => uiManager.toggleHelp(),
        uiManager
    });

    uiManager.domHudLeftCluster.append(button);
    uiManager.helpButton = button;

    return button;
}

export function createDomVersionHud(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);

    removeExistingElement(uiManager.versionText);

    const versionText = documentRef.createElement('div');
    versionText.className = 'dom-hud-version';
    versionText.dataset.hudVersion = 'true';
    versionText.textContent = VERSION_LABEL;

    uiManager.domHudBottomBar.append(versionText);
    uiManager.versionText = versionText;

    return versionText;
}

export function createDomUiHud(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);
    createDomScoreHud(uiManager, { documentRef });
    createDomInventoryHudButton(uiManager, { documentRef });
    createDomQuestHudButton(uiManager, { documentRef });
    createDomHelpHudButton(uiManager, { documentRef });
    createDomVersionHud(uiManager, { documentRef });

    return uiManager;
}