class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.threshold = 20; // Min drag distance
        this.direction = { x: 0, y: 0 };
        this.isDragging = false; // Track if drag is active

        // Touch and mouse events
        scene.input.on('pointerdown', (pointer) => {
            this.touchStart.x = pointer.x;
            this.touchEnd.x = pointer.x;
            this.touchStart.y = pointer.y;
            this.touchEnd.y = pointer.y;
            this.isDragging = true;
            this.updateDirection(pointer); // Initial direction
        });
        scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.touchEnd.x = pointer.x;
                this.touchEnd.y = pointer.y;
                this.updateDirection(pointer); // Update direction continuously
            }
        });
        scene.input.on('pointerup', (pointer) => {
            this.touchEnd.x = pointer.x;
            this.touchEnd.y = pointer.y;
            this.isDragging = false;
            this.direction = { x: 0, y: 0 };
        });
    }

    updateDirection(pointer) {
        const dx = pointer.x - this.scene.player.x; // Distance from player to cursor
        const dy = pointer.y - this.scene.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.threshold) {
            this.direction.x = dx / dist; // Normalize to unit vector
            this.direction.y = dy / dist;
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

        // Touch or drag if no keyboard
        if (dir.x === 0 && dir.y === 0 && this.isDragging) {
            dir = this.direction;
        }

        return dir;
    }
}

export default InputManager;