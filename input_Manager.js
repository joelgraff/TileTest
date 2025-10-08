class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.threshold = 20; // Min drag distance
        this.direction = { x: 0, y: 0 };
        this.isDragging = false; // Track if drag is active
        this.target = null; // Target position for tap-to-move

        // Touch and mouse events
        scene.input.on('pointerdown', (pointer) => {
            console.log('[InputManager] pointerdown', pointer.x, pointer.y);
            console.log('[InputManager] scene.uiManager:', scene.uiManager);
            if (scene.uiManager) {
                console.log('[InputManager] uiManager keys:', Object.keys(scene.uiManager));
            }
            this.touchStart.x = pointer.x;
            this.touchEnd.x = pointer.x;
            this.touchStart.y = pointer.y;
            this.touchEnd.y = pointer.y;
            this.target = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.isDragging = false;
            if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                console.log('[InputManager] calling uiManager.handlePointerMove (down)', pointer.x, pointer.y);
                scene.uiManager.handlePointerMove(pointer.x, pointer.y, true);
            } else {
                console.warn('[InputManager] uiManager.handlePointerMove not found');
            }
        });
        scene.input.on('pointermove', (pointer) => {
            if (!this.isDragging) {
                const dx = pointer.x - this.touchStart.x;
                const dy = pointer.y - this.touchStart.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.threshold) {
                    this.isDragging = true;
                    this.target = null; // Cancel tap-to-move if dragging
                    this.updateDirection(pointer);
                }
            } else {
                console.log('[InputManager] pointermove', pointer.x, pointer.y);
                console.log('[InputManager] scene.uiManager:', scene.uiManager);
                if (scene.uiManager) {
                    console.log('[InputManager] uiManager keys:', Object.keys(scene.uiManager));
                }
                this.touchEnd.x = pointer.x;
                this.touchEnd.y = pointer.y;
                this.updateDirection(pointer); // Update direction continuously
                if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                    console.log('[InputManager] calling uiManager.handlePointerMove (move)', pointer.x, pointer.y);
                    scene.uiManager.handlePointerMove(pointer.x, pointer.y, true);
                } else {
                    console.warn('[InputManager] uiManager.handlePointerMove not found');
                }
            }
        });
        scene.input.on('pointerup', (pointer) => {
            console.log('[InputManager] pointerup', pointer.x, pointer.y);
            console.log('[InputManager] scene.uiManager:', scene.uiManager);
            if (scene.uiManager) {
                console.log('[InputManager] uiManager keys:', Object.keys(scene.uiManager));
            }
            if (this.isDragging) {
                this.direction = { x: 0, y: 0 };
            }
            this.isDragging = false;
            if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                console.log('[InputManager] calling uiManager.handlePointerMove (up)', pointer.x, pointer.y);
                scene.uiManager.handlePointerMove(pointer.x, pointer.y, false);
            } else {
                console.warn('[InputManager] uiManager.handlePointerMove not found');
            }
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

        // Tap-to-move target
        if (dir.x === 0 && dir.y === 0 && this.target) {
            const dx = this.target.x - this.scene.player.x;
            const dy = this.target.y - this.scene.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
                this.target = null;
                return { x: 0, y: 0 };
            } else {
                dir.x = dx / dist;
                dir.y = dy / dist;
            }
        }

        // Touch drag if no keyboard or target
        if (dir.x === 0 && dir.y === 0 && this.isDragging) {
            dir = this.direction;
        }

        return dir;
    }
}

export default InputManager;