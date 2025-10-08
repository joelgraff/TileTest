import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';
import CollisionManager from './collisionManager.js';
import InputManager from './input_Manager.js';

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: 'game-container',
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
}

function create() {
    scene = this;
    MapManager.create(scene);

    if (!scene.map) {
        console.error('Map failed to load. Check asset paths and mapManager.js preload.');
        return;
    }

    PlayerManager.create(scene);
    NPCManager.create(scene);

    // Instance UIManager and attach to scene
    import('./uiManager.js').then(({ default: UIManager }) => {
        scene.uiManager = new UIManager(scene);
        console.log('[main.js] UIManager instanced and attached to scene:', scene.uiManager);
    });

    scene.inputManager = new InputManager(scene);
    CollisionManager.create(scene);

    if (scene.player) {
        scene.cameras.main.startFollow(scene.player);
        scene.cameras.main.setBounds(0, 0, scene.map.widthInPixels, scene.map.heightInPixels);

        // Zoom in on mobile for better visibility
        if (!scene.sys.game.device.os.desktop) {
            if (window.innerHeight > window.innerWidth) {
                // Vertical orientation: substantial zoom
                scene.cameras.main.setZoom(2.5);
            } else {
                // Horizontal orientation: moderate zoom
                scene.cameras.main.setZoom(1.8);
            }
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