import CONFIG from './config.js';

class PlayerManager {
    static createPlayer(scene) {
        const objectLayer = scene.map.getObjectLayer('player');
        if (!objectLayer) {
            console.error('Player object layer not found in map.');
            return null;
        }

        const startObj = scene.map.findObject('player', obj => obj.name === 'start');
        if (!startObj) {
            console.error('Start object not found in map.');
            return null;
        }

        const playerTileset = scene.playerTileset;
        if (!playerTileset) {
            console.error('Player tileset not found in scene. Ensure map.js sets scene.playerTileset.');
            return null;
        }

        const player = scene.physics.add.sprite(startObj.x, startObj.y, CONFIG.ASSETS.PLAYER, 0);
        player.setCollideWorldBounds(true);

        const depthProp = objectLayer.properties && objectLayer.properties.find(prop => prop.name === 'depth');
        player.setDepth(depthProp && typeof depthProp.value === 'number' ? depthProp.value : 1);

        const collisionBoxes = {};
        const tiles = playerTileset.tileData;
        if (tiles) {
            for (let tileId in tiles) {
                if (tiles[tileId].objectgroup && tiles[tileId].objectgroup.objects.length > 0) {
                    const obj = tiles[tileId].objectgroup.objects[0];
                    collisionBoxes[tileId] = { width: obj.width, height: obj.height, x: obj.x, y: obj.y };
                }
            }
            if (collisionBoxes['0']) {
                const obj = collisionBoxes['0'];
                player.setSize(Math.round(obj.width), Math.round(obj.height));
                player.setOffset(Math.round(obj.x), Math.round(obj.y));
            }
        } else {
            console.warn('No tile data found for player tileset. Using default collision box.');
            player.setSize(CONFIG.PLAYER.DEFAULT_SIZE.width, CONFIG.PLAYER.DEFAULT_SIZE.height);
            player.setOffset(CONFIG.PLAYER.DEFAULT_SIZE.offsetX, CONFIG.PLAYER.DEFAULT_SIZE.offsetY);
        }

        scene.anims.create({
            key: 'down', frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { frames: [0, 1, 2, 3] }),
            frameRate: 10, repeat: -1
        });
        scene.anims.create({
            key: 'left', frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { frames: [4, 5, 6, 7] }),
            frameRate: 10, repeat: -1
        });
        scene.anims.create({
            key: 'right', frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { frames: [8, 9, 10, 11] }),
            frameRate: 10, repeat: -1
        });
        scene.anims.create({
            key: 'up', frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { frames: [12, 13, 14, 15] }),
            frameRate: 10, repeat: -1
        });

        scene.directionVectorGraphic = scene.add.graphics();
        scene.directionVectorGraphic.setDepth(100);

        player.collisionBoxes = collisionBoxes;
        scene.player = player;

        return player;
    }

    static setupInput(scene) {
        scene.cursors = scene.input.keyboard.createCursorKeys();
        scene.debugKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
    }

    static handlePlayerMovement(scene) {
        if (!scene.player || !scene.cursors) return;
        const player = scene.player;
        player.setVelocity(0, 0);
        player.setDepth(scene.map.getObjectLayer('player').properties?.find(prop => prop.name === 'depth')?.value || 1);

        let frameIndex;
        if (scene.cursors.left.isDown) {
            player.setVelocityX(-CONFIG.PLAYER.SPEED);
            player.anims.play('left', true);
            frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 4;
        } else if (scene.cursors.right.isDown) {
            player.setVelocityX(CONFIG.PLAYER.SPEED);
            player.anims.play('right', true);
            frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 8;
        } else if (scene.cursors.up.isDown) {
            player.setVelocityY(-CONFIG.PLAYER.SPEED);
            player.anims.play('up', true);
            frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 12;
        } else if (scene.cursors.down.isDown) {
            player.setVelocityY(CONFIG.PLAYER.SPEED);
            player.anims.play('down', true);
            frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 0;
        } else {
            player.anims.stop();
            frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 0;
        }

        if (player.collisionBoxes[frameIndex]) {
            const obj = player.collisionBoxes[frameIndex];
            player.setSize(Math.round(obj.width), Math.round(obj.height));
            player.setOffset(Math.round(obj.x), Math.round(obj.y));
        } else {
            player.setSize(CONFIG.PLAYER.DEFAULT_SIZE.width, CONFIG.PLAYER.DEFAULT_SIZE.height);
            player.setOffset(CONFIG.PLAYER.DEFAULT_SIZE.offsetX, CONFIG.PLAYER.DEFAULT_SIZE.offsetY);
        }

        scene.directionVectorGraphic.clear();
        if (scene.debugEnabled) {
            const velocity = player.body.velocity;
            if (velocity.x !== 0 || velocity.y !== 0) {
                const vectorLength = 20;
                const angle = Math.atan2(velocity.y, velocity.x);
                const endX = player.x + vectorLength * Math.cos(angle);
                const endY = player.y + vectorLength * Math.sin(angle);
                scene.directionVectorGraphic.lineStyle(2, 0xff0000, 1);
                scene.directionVectorGraphic.beginPath();
                scene.directionVectorGraphic.moveTo(player.x, player.y);
                scene.directionVectorGraphic.lineTo(endX, endY);
                scene.directionVectorGraphic.strokePath();
            }
        }
    }
}

export default PlayerManager;