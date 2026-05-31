import { initializeInteractionReadiness } from './bootReadiness.js';
import CollisionManager from './collisionManager.js';
import CONFIG from './config.js';
import DomainManager from './domainManager.js';
import GameState from './gameState.js';
import { createLiveVendorContentService } from './liveVendorContentService.js';
import { initializeSceneManagers } from './sceneComposition.js';
import { initializeSceneRuntime } from './sceneRuntimeSetup.js';
import { initializeSceneWorld } from './sceneWorldSetup.js';
import { getSavedActiveVendorIds, resolveSessionVendorIds } from './sessionVendorRoster.js';
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
        createLiveVendorContentServiceFn = createLiveVendorContentService,
        recreateCollision = CollisionManager.create
    } = {}
) {
    scene.testMode = isTestMode;

    const gameState = new GameStateClass();
    scene.gameState = gameState;
    bindSceneBooleanFlagFn(scene, gameState, 'interactionsEnabled');

    const liveVendorContentService = createLiveVendorContentServiceFn();
    let liveContentReadyPromise = null;
    if (liveVendorContentService) {
        scene.liveVendorContentService = liveVendorContentService;
        liveContentReadyPromise = liveVendorContentService.start?.() ?? null;
    }

    DomainManagerModule.loadDomains();
    scene.vendors = scene.cache.json.get(CONFIG.CONTENT.VENDORS);
    scene.discoveryTrails = scene.cache.json.get(CONFIG.CONTENT.DISCOVERY_TRAILS) ?? [];

    if (!initializeSceneWorldFn(scene)) {
        return {
            initialized: false,
            gameState,
            readinessPromise: null
        };
    }

    const activeVendorIds = resolveSessionVendorIds({
        vendors: scene.vendors,
        npcCount: scene.npcGroup?.getChildren?.().length ?? 0,
        savedVendorIds: isTestMode ? [] : getSavedActiveVendorIds(),
        testMode: isTestMode
    });
    scene.activeVendorIds = activeVendorIds;

    initializeSceneManagersFn(scene, {
        state: gameState,
        discoveryTrails: scene.discoveryTrails,
        activeVendorIds,
        ...(liveVendorContentService ? { liveVendorContentService } : {})
    });

    const assignedVendors = scene.vendorManager?.getAssignedVendors?.() ?? [];
    scene.questManager?.setSessionVendorIds?.(assignedVendors.map(vendor => vendor.id));
    scene.questManager?.setDiscoveryVendorPool?.(assignedVendors);

    const readinessPromise = initializeInteractionReadinessFn({
        questManager: scene.questManager,
        vendors: scene.vendors,
        discoveryTrails: scene.discoveryTrails,
        liveVendorContentService,
        liveContentReadyPromise,
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