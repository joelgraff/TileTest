class PlayerManager {
    static preload(scene) {
        scene.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 48 });
    }

    static create(scene) {
        const { x: startX, y: startY } = PlayerManager.getPlayerStartPosition(scene);
        scene.player = PlayerManager.createPlayerSprite(scene, startX, startY);
        PlayerManager.setPlayerCollisionBox(scene);
        PlayerManager.createPlayerAnimations(scene);
    }

    static update(scene, time, delta) {
        if (!scene.player || !scene.inputManager) return;
        PlayerManager.handlePlayerMovement(scene);
        PlayerManager.handlePlayerAnimation(scene);
        PlayerManager.updatePlayerDepth(scene); // Progressive depth
        PlayerManager.drawPlayerDebug(scene);
    }

    // --- Helper Functions ---

    static getPlayerStartPosition(scene) {
        const playerLayer = scene.map.getObjectLayer('player');
        let x = 100, y = 100;
        if (playerLayer && playerLayer.objects && playerLayer.objects.length > 0) {
            const startObj = playerLayer.objects.find(obj => obj.name === 'start');
            if (startObj) {
                x = startObj.x;
                y = startObj.y;
            }
        }
        return { x, y };
    }

    static createPlayerSprite(scene, x, y) {
        const sprite = scene.physics.add.sprite(x, y, 'player', 0);
        sprite.setCollideWorldBounds(true);
        return sprite;
    }

    static setPlayerCollisionBox(scene) {
        const playerTileset = scene.map.tilesets.find(ts => ts.name === 'player');
        if (!playerTileset || !playerTileset.tileData) return;

        let frameIndex = scene.player.frame.name ?? scene.player.frame.index ?? 0;
        if (typeof frameIndex === 'string') frameIndex = parseInt(frameIndex, 10) || 0;
        if (playerTileset.firstgid && frameIndex >= playerTileset.firstgid) {
            frameIndex = frameIndex - playerTileset.firstgid;
        }

        const tileData = playerTileset.tileData[frameIndex];
        if (
            tileData &&
            tileData.objectgroup &&
            tileData.objectgroup.objects &&
            tileData.objectgroup.objects.length > 0
        ) {
            const obj = tileData.objectgroup.objects[0];
            scene.player.setSize(obj.width, obj.height);
            scene.player.setOffset(obj.x, obj.y);
        }
    }

    static createPlayerAnimations(scene) {
        scene.anims.create({
            key: 'down',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'left',
            frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'up',
            frames: scene.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1
        });
    }

    static handlePlayerMovement(scene) {
        const direction = scene.inputManager.getDirection();
        const speed = 200;
        scene.player.setVelocity(direction.x * speed, direction.y * speed);
    }

    static handlePlayerAnimation(scene) {
        const direction = scene.inputManager.getDirection();
        if (direction.x === 0 && direction.y === 0) {
            scene.player.anims.stop();
            scene.player.setFrame(0); // Idle frame (down)
        } else {
            let animKey = 'down';
            if (Math.abs(direction.x) > Math.abs(direction.y)) {
                animKey = direction.x > 0 ? 'right' : 'left';
            } else if (direction.y !== 0) {
                animKey = direction.y > 0 ? 'down' : 'up';
            }
            scene.player.anims.play(animKey, true);
        }
    }

    static updatePlayerDepth(scene) {
        // Progressive depth: 0 (top) to 2*map.height (bottom)
        const mapHeight = scene.map.heightInPixels;
        const y = Phaser.Math.Clamp(scene.player.y, 0, mapHeight);
        const depth = Math.floor((y / mapHeight) * (2 * mapHeight));
        scene.player.setDepth(depth);

    }

    static drawPlayerDebug(scene) {
        const direction = scene.inputManager.getDirection();
        if (scene.debugEnabled) {
            if (!scene.playerDebugGraphics) {
                scene.playerDebugGraphics = scene.add.graphics().setDepth(999);
            }
            scene.playerDebugGraphics.clear();
            // Draw direction vector
            scene.playerDebugGraphics.lineStyle(2, 0xff0000, 1);
            scene.playerDebugGraphics.strokeLineShape(
                new Phaser.Geom.Line(
                    scene.player.x,
                    scene.player.y,
                    scene.player.x + direction.x * 32,
                    scene.player.y + direction.y * 32
                )
            );
            // Draw custom collision box
            const body = scene.player.body;
            if (body) {
                scene.playerDebugGraphics.lineStyle(2, 0x00ff00, 1);
                scene.playerDebugGraphics.strokeRect(
                    body.x,
                    body.y,
                    body.width,
                    body.height
                );
            }
        } else if (scene.playerDebugGraphics) {
            scene.playerDebugGraphics.destroy();
            scene.playerDebugGraphics = null;
        }
    }
}

export default PlayerManager;