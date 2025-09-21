function loadPlayerAssets(scene) {
    // Player tileset loaded in map.js as a spritesheet
}

function createPlayer(scene) {
    const objectLayer = scene.map.getObjectLayer('player');
    if (!objectLayer) {
        console.error('Player object layer not found in map.');
        return;
    }

    const startObj = scene.map.findObject('player', obj => obj.name === 'start');
    if (!startObj) {
        console.error('Start object not found in map.');
        return;
    }

    const playerTileset = scene.playerTileset;
    if (!playerTileset) {
        console.error('Player tileset not found in scene. Ensure map.js sets scene.playerTileset.');
        return;
    }

    const player = scene.physics.add.sprite(startObj.x, startObj.y, 'player', 0);
    player.setCollideWorldBounds(true);

    const depthProp = objectLayer.properties && objectLayer.properties.find(prop => prop.name === 'depth');
    const playerDepth = depthProp && typeof depthProp.value === 'number' ? depthProp.value : 1;
    player.setDepth(playerDepth);

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
        } else {
            console.warn('No collision box for initial tile 0.');
        }
    } else {
        console.warn('No tile data found for player tileset. Using default collision box.');
        player.setSize(24, 10);
        player.setOffset(0, 30);
    }

    scene.anims.create({
        key: 'down',
        frames: scene.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 3] }),
        frameRate: 10,
        repeat: -1
    });
    scene.anims.create({
        key: 'left',
        frames: scene.anims.generateFrameNumbers('player', { frames: [4, 5, 6, 7] }),
        frameRate: 10,
        repeat: -1
    });
    scene.anims.create({
        key: 'right',
        frames: scene.anims.generateFrameNumbers('player', { frames: [8, 9, 10, 11] }),
        frameRate: 10,
        repeat: -1
    });
    scene.anims.create({
        key: 'up',
        frames: scene.anims.generateFrameNumbers('player', { frames: [12, 13, 14, 15] }),
        frameRate: 10,
        repeat: -1
    });

    scene.directionVectorGraphic = scene.add.graphics();
    scene.directionVectorGraphic.setDepth(100);

    player.collisionBoxes = collisionBoxes;
    scene.player = player;
}

function setupInput(scene) {
    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.debugKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
}

function handlePlayerMovement(scene) {
    if (!scene.player || !scene.cursors) return;
    const player = scene.player;
    const speed = 100;
    player.setVelocity(0, 0);
    player.setDepth(scene.map.getObjectLayer('player').properties?.find(prop => prop.name === 'depth')?.value || 1);

    let frameIndex;
    if (scene.cursors.left.isDown) {
        player.setVelocityX(-speed);
        player.anims.play('left', true);
        frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 4;
    } else if (scene.cursors.right.isDown) {
        player.setVelocityX(speed);
        player.anims.play('right', true);
        frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 8;
    } else if (scene.cursors.up.isDown) {
        player.setVelocityY(-speed);
        player.anims.play('up', true);
        frameIndex = player.anims.currentFrame ? player.anims.currentFrame.index : 12;
    } else if (scene.cursors.down.isDown) {
        player.setVelocityY(speed);
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
        player.setSize(24, 10);
        player.setOffset(0, 30);
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