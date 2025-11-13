import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import InputManager from './input_Manager.js';
import VendorManager from './vendorManager.js';
import UIManager from './uiManager.js';
import DomainManager from './domainManager.js';
import QuestManager from './questManager.js';
import CrisisManager from './CrisisManager.js';
import MapDuplicationModule from './MapDuplicationModule.js';
import CameraManager from './cameraManager.js';

// Determine device type for scaling
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Configure map duplication based on URL parameter or default setting
const urlParams = new URLSearchParams(window.location.search);
const enableDuplication = urlParams.get('duplicated') === 'true' || false; // Default to false

// Store duplication state globally for console access
window.mapDuplicationEnabled = enableDuplication;

console.log(`Map duplication: ${enableDuplication ? 'ENABLED' : 'DISABLED'} (URL param: "${urlParams.get('duplicated')}")`);
if (enableDuplication) {
    console.log('Add ?duplicated=true to URL to enable duplicated map layout');
} else {
    console.log('Add ?duplicated=true to URL to enable duplicated map layout');
}

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
    },
    duplicateMap: enableDuplication
};

let scene;

function preload() {
    // Load assets and map data via MapManager
    MapManager.preload(this);
    PlayerManager.preload?.(this);
    NPCManager.preload?.(this);
    this.load.json('vendors', 'vendors.json');
    this.load.json('technology_domains', 'technology_domains.json');
}

function create() {
    scene = this;

    // Load vendors data
    scene.vendors = scene.cache.json.get('vendors');

    // Load and initialize domain data synchronously
    const domainsData = scene.cache.json.get('technology_domains');
    DomainManager.initializeWithData(domainsData);

    console.log('Vendors loaded:', scene.vendors);
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

    // Update physics world bounds to match the resized map
    scene.physics.world.setBounds(0, 0, scene.map.widthInPixels, scene.map.heightInPixels);
    console.log(`Physics world bounds set to: ${scene.map.widthInPixels}x${scene.map.heightInPixels}`);

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

    // Initialize CrisisManager
    scene.crisisManager = new CrisisManager();

    CollisionManager.create(scene);

    if (scene.player) {
        // Initialize Sierra-style camera system
        scene.cameraManager = new CameraManager(scene);
        scene.cameraManager.initialize();

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

        // Handle tile ID visualization for debug mode
        // First, clean up any existing tile ID text objects
        scene.children.each(child => {
            if (child.type === 'Text' && child.text && /^\d+$/.test(child.text)) {
                child.destroy();
            }
        });

        if (scene.debugEnabled) {
            // Import NPCSpawner dynamically to avoid circular imports
            import('./NPCSpawner.js').then(({ default: NPCSpawner }) => {
                // Tile ID map is already built during scene creation, just visualize
                NPCSpawner.visualizeTileIds(scene);
            });
        }
    });

    // Add console commands for map duplication control
    window.toggleMapDuplication = () => {
        window.mapDuplicationEnabled = !window.mapDuplicationEnabled;
        console.log(`Map duplication is now: ${window.mapDuplicationEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log('To apply changes: refresh the page');
        console.log('Or add/remove ?duplicated=true from the URL');
        return `Current state: ${window.mapDuplicationEnabled}`;
    };

    console.log('Game scene created');
    console.log('Type toggleMapDuplication() in console to see duplication status and instructions');
}

function update(time, delta) {
    PlayerManager.update?.(scene, time, delta);
    NPCManager.update?.(scene, time, delta);
    scene.vendorManager?.update();
    CollisionManager.update?.(scene, time, delta);
    MapManager.update?.(scene, time, delta);
    scene.inputManager?.update?.(scene, time, delta);
    scene.crisisManager?.updateCrisisIndicators(scene);

    // Update Sierra-style camera system
    scene.cameraManager?.update();
    scene.cameraManager?.updateTransition();
}
const game = new Phaser.Game(config);

// Find object layer by name
function getObjectLayer(map, layerName) {
    if (!map || !map.layers) return null;
    return map.layers.find(layer => layer.type === 'objectgroup' && layer.name === layerName);
}

export default game;