import CONFIG from './config.js';
import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import {
    createBootstrapPreloadOptions,
    loadBootstrapRuntimeProfile
} from './bootstrapRuntimeProfile.js';
import { initializeSceneBootstrap } from './sceneBootstrap.js';
import { createTestModeApi } from './testModeApi.js';

// Determine device type for scaling
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('test');
const bootstrapRuntimeProfile = await loadBootstrapRuntimeProfile().catch(error => {
    console.warn('Falling back to static preload defaults.', error);
    return null;
});
const bootstrapPreloadOptions = createBootstrapPreloadOptions(bootstrapRuntimeProfile);

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: 'game-container',
    scale: {
        mode: isMobile ? Phaser.Scale.ENVELOP : Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

let scene;
const testApi = typeof window !== 'undefined' ? createTestModeApi(() => scene) : null;

function preload() {
    // Load assets and map data via MapManager
    this.mapRuntimeProfile = bootstrapRuntimeProfile;
    MapManager.preload(this, { packageName: bootstrapPreloadOptions.packageName });
    PlayerManager.preload?.(this, bootstrapPreloadOptions.player);
    NPCManager.preload?.(this, bootstrapPreloadOptions.npc);
    this.load.json(
        CONFIG.CONTENT.VENDORS,
        `${CONFIG.CONTENT.VENDORS}${CONFIG.PATHS.JSON_EXTENSION}`
    );
    this.load.json(
        CONFIG.CONTENT.DISCOVERY_TRAILS,
        `${CONFIG.CONTENT.DISCOVERY_TRAILS}${CONFIG.PATHS.JSON_EXTENSION}`
    );
}

function create() {
    scene = this;
    const bootstrap = initializeSceneBootstrap(scene, {
        isTestMode,
        isMobile,
        recreateCollision: CollisionManager.create
    });

    if (!bootstrap.initialized) {
        return;
    }

    console.log('Game scene created');
}

function update(time, delta) {
    PlayerManager.update?.(scene, time, delta);
    NPCManager.update?.(scene, time, delta);
    scene.vendorManager?.update();
    MapManager.update?.(scene, time, delta);
    scene.inputManager?.update?.(scene, time, delta);
}
const game = new Phaser.Game(config);

if (typeof window !== 'undefined') {
    window.__tileTest = {
        get game() {
            return game;
        },
        get scene() {
            return scene;
        },
        get testApi() {
            return isTestMode ? testApi : undefined;
        }
    };
}

export default game;