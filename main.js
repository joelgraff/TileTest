import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import { initializeSceneBootstrap } from './sceneBootstrap.js';

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