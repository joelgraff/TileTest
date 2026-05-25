import { initializeInteractionReadiness } from './bootReadiness.js';
import CollisionManager from './collisionManager.js';
import DomainManager from './domainManager.js';
import GameState from './gameState.js';
import { initializeSceneManagers } from './sceneComposition.js';
import { initializeSceneRuntime } from './sceneRuntimeSetup.js';
import { initializeSceneWorld } from './sceneWorldSetup.js';
import { bindSceneBooleanFlag } from './stateBindings.js';

export function initializeSceneBootstrap(
    scene,
    {
        isTestMode = false,
        isMobile = false,
        GameStateClass = GameState,
        DomainManagerModule = DomainManager,
        initializeSceneWorldFn = initializeSceneWorld,
        initializeSceneManagersFn = initializeSceneManagers,
        initializeInteractionReadinessFn = initializeInteractionReadiness,
        initializeSceneRuntimeFn = initializeSceneRuntime,
        bindSceneBooleanFlagFn = bindSceneBooleanFlag,
        recreateCollision = CollisionManager.create
    } = {}
) {
    scene.testMode = isTestMode;

    const gameState = new GameStateClass();
    scene.gameState = gameState;
    bindSceneBooleanFlagFn(scene, gameState, 'interactionsEnabled');

    DomainManagerModule.loadDomains();
    scene.vendors = scene.cache.json.get('vendors');

    if (!initializeSceneWorldFn(scene)) {
        return {
            initialized: false,
            gameState,
            readinessPromise: null
        };
    }

    initializeSceneManagersFn(scene, { state: gameState });

    const readinessPromise = initializeInteractionReadinessFn({
        questManager: scene.questManager,
        vendors: scene.vendors,
        setInteractionsEnabled: (isReady) => {
            scene.interactionsEnabled = isReady;
        }
    });

    initializeSceneRuntimeFn(scene, {
        isMobile,
        recreateCollision,
        interactionCoordinator: scene.interactionCoordinator
    });

    return {
        initialized: true,
        gameState,
        readinessPromise
    };
}