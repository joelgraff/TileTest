import InputManager from './inputManager.js';

class PlayerManager {
    static createPlayer(scene) {
        const spawnPoint = { x: 100, y: 100 }; // Default spawn, adjust as needed
        scene.player = scene.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'player', 0);
        scene.player.setDepth(1);
        scene.player.setCollideWorldBounds(true);
        scene.player.setBounce(0);
        scene.player.setDrag(0);

        // Define animation frames (assuming a spritesheet layout)
        scene.anims.create({
            key: 'down',
            frames: scene.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 3] }),
            frameRate: 6,
            repeat: -1
        });
        scene.anims.create({
            key: 'left',
            frames: scene.anims.generateFrameNumbers('player', { frames: [4, 5, 6, 7] }),
            frameRate: 6,
            repeat: -1
        });
        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers('player', { frames: [8, 9, 10, 11] }),
            frameRate: 6,
            repeat: -1
        });
        scene.anims.create({
            key: 'up',
            frames: scene.anims.generateFrameNumbers('player', { frames: [12, 13, 14, 15] }),
            frameRate: 6,
            repeat: -1
        });

        // Add collision boxes (example)
        scene.player.collisionBoxes = [
            { width: 16, height: 16, x: 8, y: 8 }, // Adjust based on sprite
        ];

        return !!scene.player;
    }

    static setupInput(scene) {
        scene.inputManager = new InputManager(scene); // Initialize InputManager
    }

    static handlePlayerMovement(scene) {
        if (!scene.player) return;

        const direction = scene.inputManager.getDirection();
        const speed = 200; // Adjust speed as needed

        // Apply velocity based on direction
        scene.player.setVelocity(direction.x * speed, direction.y * speed);

        // Stop movement if no direction
        if (direction.x === 0 && direction.y === 0) {
            scene.player.setVelocity(0, 0);
            scene.player.anims.stop();
            scene.player.setFrame(0); // Idle frame (down)
        } else {
            // Determine animation direction
            let animKey = 'down';
            if (Math.abs(direction.x) > Math.abs(direction.y)) {
                animKey = direction.x > 0 ? 'right' : 'left';
            } else if (direction.y !== 0) {
                animKey = direction.y > 0 ? 'down' : 'up';
            }
            scene.player.anims.play(animKey, true);
        }

        // Update collision box based on current frame
        const frameIndex = scene.player.anims.currentFrame ? scene.player.anims.currentFrame.index : 0;
        if (scene.player.collisionBoxes && scene.player.collisionBoxes[frameIndex]) {
            const obj = scene.player.collisionBoxes[frameIndex];
            scene.player.setSize(Math.round(obj.width), Math.round(obj.height));
            scene.player.setOffset(Math.round(obj.x), Math.round(obj.y));
        } else {
            scene.player.setSize(16, 16); // Default size, adjust as needed
            scene.player.setOffset(8, 8); // Default offset, adjust as needed
        }
    }
}

export default PlayerManager;