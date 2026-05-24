import InputManager from './input_Manager.js';
import VendorManager from './vendorManager.js';
import InteractionCoordinator from './interactionCoordinator.js';
import UIManager from './uiManager.js';
import QuestManager from './questManager.js';

export function initializeSceneManagers(
    scene,
    {
        state = scene.gameState ?? null,
        UIManagerClass = UIManager,
        InputManagerClass = InputManager,
        QuestManagerClass = QuestManager,
        VendorManagerClass = VendorManager,
        InteractionCoordinatorClass = InteractionCoordinator
    } = {}
) {
    const uiManager = new UIManagerClass(scene, { state });
    const inputManager = new InputManagerClass(scene, {
        uiManager
    });
    const questManager = new QuestManagerClass({ state });
    const vendorManager = new VendorManagerClass(scene, {
        uiManager,
        npcGroup: scene.npcGroup,
        player: scene.player,
        camera: scene.cameras.main,
        gameObjectFactory: scene.add,
        testMode: scene.testMode
    });
    const interactionCoordinator = new InteractionCoordinatorClass(scene, {
        vendorManager,
        inputManager
    });

    uiManager.setInputManager(inputManager);
    uiManager.setQuestManager(questManager);

    scene.uiManager = uiManager;
    scene.inputManager = inputManager;
    scene.questManager = questManager;
    scene.vendorManager = vendorManager;
    scene.interactionCoordinator = interactionCoordinator;

    return {
        uiManager,
        inputManager,
        questManager,
        vendorManager,
        interactionCoordinator
    };
}