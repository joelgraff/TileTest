import {
    createDomHelpHudButton,
    createDomInventoryHudButton,
    createDomPassportHintHud,
    createDomQuestHudButton,
    createDomScoreHud,
    createDomUiHud,
    createDomVersionHud,
    updateDomPassportHintHud
} from './domHudSurface.js';

export function createScoreHud(uiManager) {
    return createDomScoreHud(uiManager);
}

export function createInventoryHudButton(uiManager) {
    return createDomInventoryHudButton(uiManager);
}

export function createQuestHudButton(uiManager) {
    return createDomQuestHudButton(uiManager);
}

export function createHelpHudButton(uiManager) {
    return createDomHelpHudButton(uiManager);
}

export function createVersionHud(uiManager) {
    return createDomVersionHud(uiManager);
}

export function createPassportHintHud(uiManager) {
    return createDomPassportHintHud(uiManager);
}

export function updatePassportHintHud(uiManager, options = {}) {
    return updateDomPassportHintHud(uiManager, options);
}

export function createUiHud(uiManager) {
    return createDomUiHud(uiManager);
}