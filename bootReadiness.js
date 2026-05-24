export function initializeInteractionReadiness(scene) {
    return scene.questManager.init(scene.vendors, scene.uiManager, scene)
        .then(isReady => {
            scene.interactionsEnabled = isReady;
            return isReady;
        });
}