import { createDiscoveryHudModel } from './discoveryHudModel.js';

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

function createHudButtonElement(documentRef, label, { controlName, onClick, preparesUiInteraction, uiManager, className = 'dom-hud-button' }) {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = className;
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

function createHudTextElement(documentRef, className) {
    const element = documentRef.createElement('div');
    element.className = className;

    return element;
}

function getQuestHudState(uiManager) {
    const questManager = uiManager.questManager;

    return {
        activeQuests: questManager?.getActiveQuests?.() ?? uiManager.state?.activeQuests ?? [],
        completedQuests: questManager?.getCompletedQuests?.() ?? uiManager.state?.completedQuests ?? [],
        inventory: uiManager.inventory ?? uiManager.state?.inventory ?? [],
        score: uiManager.score ?? uiManager.state?.score ?? 0
    };
}

function ensureDomPassportHintHud(uiManager, documentRef) {
    ensureHudRoot(uiManager, documentRef);
    if (!uiManager.domHudBottomBar) {
        return null;
    }

    if (uiManager.passportHint) {
        return uiManager.passportHint;
    }

    const passportHint = documentRef.createElement('div');
    passportHint.className = 'dom-hud-passport';
    passportHint.dataset.hudPassport = 'true';
    passportHint.dataset.passportCollapsed = 'true';
    passportHint.hidden = true;

    const header = documentRef.createElement('div');
    header.className = 'dom-hud-passport-header';

    const label = createHudTextElement(documentRef, 'dom-hud-passport-label');
    const title = createHudTextElement(documentRef, 'dom-hud-passport-title');
    const toggle = createHudButtonElement(documentRef, 'Show', {
        controlName: 'passport',
        onClick: () => uiManager.togglePassportHint?.(),
        preparesUiInteraction: false,
        uiManager,
        className: 'dom-hud-passport-toggle'
    });
    toggle.dataset.hudPassportToggle = 'true';
    const body = documentRef.createElement('div');
    body.className = 'dom-hud-passport-body';
    const detail = createHudTextElement(documentRef, 'dom-hud-passport-detail');

    header.append(label, title, toggle);
    body.append(detail);
    passportHint.append(header, body);
    uiManager.domHudBottomBar.append(passportHint);

    uiManager.passportHint = passportHint;
    uiManager.passportHintHeader = header;
    uiManager.passportHintLabel = label;
    uiManager.passportHintTitle = title;
    uiManager.passportHintToggle = toggle;
    uiManager.passportHintBody = body;
    uiManager.passportHintDetail = detail;

    return passportHint;
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

export function updateDomPassportHintHud(uiManager, {
    documentRef = globalThis.document,
    activeQuests = null,
    completedQuests = null,
    inventory = null,
    score = null
} = {}) {
    const passportHint = ensureDomPassportHintHud(uiManager, documentRef);
    if (!passportHint) {
        return null;
    }

    const currentQuestState = getQuestHudState(uiManager);
    const model = createDiscoveryHudModel({
        activeQuests: activeQuests ?? currentQuestState.activeQuests,
        completedQuests: completedQuests ?? currentQuestState.completedQuests,
        inventory: inventory ?? currentQuestState.inventory,
        score: score ?? currentQuestState.score
    });
    const isCollapsed = uiManager.isPassportHintCollapsed !== false;

    passportHint.hidden = !model.visible;
    passportHint.dataset.passportStatus = model.status;
    passportHint.dataset.passportCollapsed = String(isCollapsed);
    uiManager.passportHintToggle.textContent = isCollapsed ? 'Show' : 'Hide';
    uiManager.passportHintToggle.dataset.passportCollapsed = String(isCollapsed);
    uiManager.passportHintBody.hidden = isCollapsed || !model.visible;
    uiManager.passportHintLabel.textContent = model.label;
    uiManager.passportHintTitle.textContent = model.title;
    uiManager.passportHintDetail.textContent = model.detail;

    return passportHint;
}

export function createDomPassportHintHud(uiManager, { documentRef = globalThis.document } = {}) {
    removeExistingElement(uiManager.passportHint);
    uiManager.passportHint = null;
    uiManager.passportHintHeader = null;
    uiManager.passportHintLabel = null;
    uiManager.passportHintTitle = null;
    uiManager.passportHintToggle = null;
    uiManager.passportHintBody = null;
    uiManager.passportHintDetail = null;

    return updateDomPassportHintHud(uiManager, { documentRef });
}

export function createDomUiHud(uiManager, { documentRef = globalThis.document } = {}) {
    ensureHudRoot(uiManager, documentRef);
    createDomScoreHud(uiManager, { documentRef });
    createDomInventoryHudButton(uiManager, { documentRef });
    createDomQuestHudButton(uiManager, { documentRef });
    createDomHelpHudButton(uiManager, { documentRef });
    createDomVersionHud(uiManager, { documentRef });
    createDomPassportHintHud(uiManager, { documentRef });

    return uiManager;
}