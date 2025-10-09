import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import InputManager from './input_Manager.js';
import VendorManager from './vendorManager.js';
import UIManager from './uiManager.js';
import DomainManager from './domainManager.js';
import QuestManager from './questManager.js';

// Determine device type for scaling
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

    // Load vendors data
    scene.vendors = scene.cache.json.get('vendors');

    // Set scale mode based on device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        scene.scale.scaleMode = Phaser.Scale.ENVELOP;
    } else {
        scene.scale.scaleMode = Phaser.Scale.NONE;
    }
    scene.scale.refresh();
    MapManager.create(scene);

    if (!scene.map) {
        console.error('Map failed to load. Check asset paths and mapManager.js preload.');
        return;
    }

    PlayerManager.create(scene);
    NPCManager.create(scene, scene.vendors);

    // Instance UIManager and attach to scene
    scene.uiManager = new UIManager(scene);
    console.log('[main.js] UIManager instanced and attached to scene:', scene.uiManager);

    scene.vendorManager = new VendorManager(scene);
    scene.inputManager = new InputManager(scene);

    // Initialize QuestManager (needs access to vendors data and scene)
    // QuestManager will handle loading DomainManager internally
    scene.questManager = new QuestManager();
    scene.questManager.init(scene.vendors, scene.uiManager, scene);

    CollisionManager.create(scene);

    if (scene.player) {
        scene.cameras.main.startFollow(scene.player);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.cameras.main.setBounds(0, 0, scene.map.widthInPixels, scene.map.heightInPixels);

        // Zoom in on mobile devices for better visibility
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // Apply zoom for mobile devices
            scene.cameras.main.setZoom(1.5);
        }
    } else {
        console.error('Player not created. Check playerManager.js and asset paths.');
    }

    scene.input.keyboard.on('keydown-BACKTICK', () => {
        scene.debugEnabled = !scene.debugEnabled;
        scene.children.each(child => {
            if (child.type === 'Graphics') child.destroy();
        });
        CollisionManager.create(scene);
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

// Find object layer by name
function getObjectLayer(map, layerName) {
    if (!map || !map.layers) return null;
    return map.layers.find(layer => layer.type === 'objectgroup' && layer.name === layerName);
}

export default game;