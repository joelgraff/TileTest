import { describe, expect, it, vi } from 'vitest';

import { initializeSceneManagers } from '../../sceneComposition.js';

describe('scene composition', () => {
    it('constructs and wires scene managers through explicit collaborators', () => {
        const scene = {
            gameState: { id: 'state-1' },
            npcGroup: { id: 'npc-group' },
            player: { id: 'player-1' },
            cameras: {
                main: { id: 'camera-1' }
            },
            add: { id: 'add-1' },
            testMode: true
        };

        const UIManagerClass = vi.fn(function (sceneArg, options) {
            this.sceneArg = sceneArg;
            this.options = options;
            this.setInputManager = vi.fn();
            this.setQuestManager = vi.fn();
        });
        const InputManagerClass = vi.fn(function (sceneArg, options) {
            this.sceneArg = sceneArg;
            this.options = options;
        });
        const QuestManagerClass = vi.fn(function (options) {
            this.options = options;
            this.setQuestCompletionHandler = vi.fn();
        });
        const VendorManagerClass = vi.fn(function (sceneArg, options) {
            this.sceneArg = sceneArg;
            this.options = options;
        });
        const InteractionCoordinatorClass = vi.fn(function (sceneArg, options) {
            this.sceneArg = sceneArg;
            this.options = options;
        });

        const managers = initializeSceneManagers(scene, {
            UIManagerClass,
            InputManagerClass,
            QuestManagerClass,
            VendorManagerClass,
            InteractionCoordinatorClass
        });

        const uiManager = UIManagerClass.mock.instances[0];
        const inputManager = InputManagerClass.mock.instances[0];
        const questManager = QuestManagerClass.mock.instances[0];
        const vendorManager = VendorManagerClass.mock.instances[0];
        const interactionCoordinator = InteractionCoordinatorClass.mock.instances[0];

        expect(UIManagerClass).toHaveBeenCalledWith(scene, { state: scene.gameState });
        expect(InputManagerClass).toHaveBeenCalledWith(scene, { uiManager });
        expect(QuestManagerClass).toHaveBeenCalledWith({ state: scene.gameState, testMode: true });
        expect(VendorManagerClass).toHaveBeenCalledWith(scene, {
            uiManager,
            npcGroup: scene.npcGroup,
            player: scene.player,
            camera: scene.cameras.main,
            gameObjectFactory: scene.add,
            testMode: true
        });
        expect(InteractionCoordinatorClass).toHaveBeenCalledWith(scene, {
            vendorManager,
            inputManager
        });
        expect(uiManager.setInputManager).toHaveBeenCalledWith(inputManager);
        expect(uiManager.setQuestManager).toHaveBeenCalledWith(questManager);
        expect(questManager.setQuestCompletionHandler).toHaveBeenCalledWith(expect.any(Function));
        expect(scene.uiManager).toBe(uiManager);
        expect(scene.inputManager).toBe(inputManager);
        expect(scene.questManager).toBe(questManager);
        expect(scene.vendorManager).toBe(vendorManager);
        expect(scene.interactionCoordinator).toBe(interactionCoordinator);
        expect(managers).toEqual({
            uiManager,
            inputManager,
            questManager,
            vendorManager,
            interactionCoordinator
        });
    });
});