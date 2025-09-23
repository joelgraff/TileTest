// InputManager.js
class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.threshold = 20; // Min drag distance
        this.direction = { x: 0, y: 0 };

        // Touch events
        scene.input.on('pointerdown', (pointer) => {
            this.touchStart.x = pointer.x;
            this.touchStart.y = pointer.y;
        });
        scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.touchEnd.x = pointer.x;
                this.touchEnd.y = pointer.y;
                this.updateTouchDirection();
            }
        });
        scene.input.on('pointerup', () => {
            this.direction = { x: 0, y: 0 };
        });
    }

    updateTouchDirection() {
        const dx = this.touchEnd.x - this.touchStart.x;
        const dy = this.touchEnd.y - this.touchStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.threshold) {
            const angle = Math.atan2(dy, dx);
            this.direction.x = Math.cos(angle);
            this.direction.y = Math.sin(angle);
        } else {
            this.direction = { x: 0, y: 0 };
        }
    }

    getDirection() {
        let dir = { x: 0, y: 0 };

        // Keyboard priority
        if (this.cursors.left.isDown) dir.x = -1;
        else if (this.cursors.right.isDown) dir.x = 1;
        if (this.cursors.up.isDown) dir.y = -1;
        else if (this.cursors.down.isDown) dir.y = 1;

        // Touch if no keyboard
        if (dir.x === 0 && dir.y === 0) {
            dir = this.direction;
        }

        return dir;
    }
}

export default InputManager;