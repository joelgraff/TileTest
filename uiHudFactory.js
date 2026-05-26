import {
    createDomHelpHudButton,
    createDomInventoryHudButton,
    createDomQuestHudButton,
    createDomScoreHud,
    createDomUiHud,
    createDomVersionHud
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

export function createUiHud(uiManager) {
    return createDomUiHud(uiManager);
}