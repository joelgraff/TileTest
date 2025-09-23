import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import CollisionManager from './collisionManager.js';
import NPCManager from './npcManager.js';
import InputManager from './input_Manager.js';

class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        MapManager.loadAssets(this);
    }

    create() {
        this.debugEnabled = true;
        this.physics.world.debugGraphic.setVisible(this.debugEnabled);

        if (!MapManager.createMap(this)) return;
        if (!PlayerManager.createPlayer(this)) return;
        CollisionManager.setupCollisions(this);
        NPCManager.createNPCs(this);
        PlayerManager.setupInput(this); // Initialize InputManager
        if (this.player) {
            this.cameras.main.startFollow(this.player);
            this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
            this.cameras.main.roundPixels = true;
        } else {
            console.error('Camera cannot follow player: player not created.');
        }

        this.input.keyboard.on('keydown-BACKTICK', () => {
            this.debugEnabled = !this.debugEnabled;
            this.physics.world.debugGraphic.setVisible(this.debugEnabled);
            if (this.npcDebugGraphics) this.npcDebugGraphics.setVisible(this.debugEnabled);
            console.log('Debug visuals:', this.debugEnabled ? 'enabled' : 'disabled');
        });

        this.versionText = this.add.text(10, this.cameras.main.height - 30, 'Version 1.3', {
            fontSize:'16px', fill: '#fff'
        }).setScrollFactor(0);
    }

    update() {
        PlayerManager.handlePlayerMovement(this);
        NPCManager.handleNPCMovements(this);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: Game
};

const game = new Phaser.Game(config);