import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import { initializeInteractionReadiness } from './bootReadiness.js';
import DomainManager from './domainManager.js';
import GameState from './gameState.js';
import { initializeSceneManagers } from './sceneComposition.js';
import { initializeSceneRuntime } from './sceneRuntimeSetup.js';
import { initializeSceneWorld } from './sceneWorldSetup.js';
import { bindSceneBooleanFlag } from './stateBindings.js';

// Determine device type for scaling
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTestMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('test');

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
            debug: false // Toggle with backtick key in-game
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

let scene;

function preload() {
    // Load assets and map data via MapManager
    MapManager.preload(this);
    PlayerManager.preload?.(this);
    NPCManager.preload?.(this);
    this.load.json('vendors', 'vendors.json');
}

function create() {
    scene = this;
    scene.testMode = isTestMode;
    const gameState = new GameState();
    scene.gameState = gameState;
    bindSceneBooleanFlag(scene, gameState, 'interactionsEnabled');

    // Start loading domain data before interactions are enabled.
    DomainManager.loadDomains();

    // Load vendors data
    scene.vendors = scene.cache.json.get('vendors');

    console.log('Vendors loaded:', scene.vendors);
    if (!initializeSceneWorld(scene)) {
        return;
    }

    initializeSceneManagers(scene, { state: gameState });

    console.log('[main.js] UIManager instanced and attached to scene:', scene.uiManager);

    initializeInteractionReadiness(scene);

    initializeSceneRuntime(scene, {
        isMobile,
        recreateCollision: CollisionManager.create
    });

    console.log('Game scene created');
}

function update(time, delta) {
    PlayerManager.update?.(scene, time, delta);
    NPCManager.update?.(scene, time, delta);
    scene.vendorManager?.update();
    CollisionManager.update?.(scene, time, delta);
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
        }
    };
}

export default game;