class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        loadMapAssets(this);
    }

    create() {
        this.debugEnabled = true;
        this.physics.world.debugGraphic.setVisible(this.debugEnabled);

        createMap(this);
        createPlayer(this);
        setupCollisions(this);
        setupInput(this);
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
            console.log('Debug visuals:', this.debugEnabled ? 'enabled' : 'disabled');
        });
    }

    update() {
        handlePlayerMovement(this);
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
    scene: GameScene
};

const game = new Phaser.Game(config);