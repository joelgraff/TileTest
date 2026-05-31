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
        InteractionCoordinatorClass = InteractionCoordinator,
        discoveryTrails = scene.discoveryTrails ?? [],
        liveVendorContentService = scene.liveVendorContentService ?? null
    } = {}
) {
    const uiManager = new UIManagerClass(scene, { state });
    const inputManager = new InputManagerClass(scene, {
        handlePointerMove: (screenX, screenY, isDown) => uiManager.handlePointerMove(screenX, screenY, isDown),
        state
    });
    const questManager = new QuestManagerClass({
        state,
        testMode: scene.testMode,
        discoveryTrails
    });
    const vendorManagerOptions = {
        state,
        showDialog: (dialogData) => uiManager.showDialog(dialogData),
        closeDialog: () => uiManager.closeDialog(),
        collectVendorItem: (item, vendorId) => uiManager.collectVendorItem(item, vendorId),
        isDialogOpen: () => uiManager.isDialogOpen,
        npcGroup: scene.npcGroup,
        player: scene.player,
        camera: scene.cameras.main,
        gameObjectFactory: scene.add,
        testMode: scene.testMode
    };

    if (liveVendorContentService) {
        vendorManagerOptions.liveContentService = liveVendorContentService;
    }

    const vendorManager = new VendorManagerClass(scene, vendorManagerOptions);
    const interactionCoordinator = new InteractionCoordinatorClass(scene, {
        vendorManager,
        handleUiInput: (key) => uiManager.handleInput(key),
        suppressPointerUntilRelease: () => inputManager.suppressPointerUntilRelease()
    });

    uiManager.setInputManager(inputManager);
    inputManager.setInteractionCoordinator?.(interactionCoordinator);
    uiManager.setQuestManager(questManager);
    questManager.setQuestCompletionHandler((quest) => uiManager.handleQuestCompletion(quest));

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