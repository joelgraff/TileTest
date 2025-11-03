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
        this.ignorePointerUntilRelease = false; // Ignore pointer events until button release
        this.pathToTarget = []; // Path for pathfinding
        this.pathIndex = 0; // Current step in path
        this.gridSize = 32; // Tile size for pathfinding
        this.lastPosition = { x: scene.player ? scene.player.x : 0, y: scene.player ? scene.player.y : 0 }; // Track last position for stuck detection
        this.stuckCounter = 0; // Counter for stuck detection

        // Touch and mouse events
        scene.input.on('pointerdown', (pointer) => {
            // Don't process player movement input when dialog is open
            if (scene.isDialogOpen) {
                this.ignorePointerUntilRelease = true;
                return;
            }

            // If we're ignoring pointer events until release, don't process
            if (this.ignorePointerUntilRelease) {
                return;
            }

            this.touchStart.x = pointer.x;
            this.touchEnd.x = pointer.x;
            this.touchStart.y = pointer.y;
            this.touchEnd.y = pointer.y;
            this.target = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.recalcualtePath(); // Calculate path to new target
            this.isDragging = false;
            if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                scene.uiManager.handlePointerMove(pointer.x, pointer.y, true);
            }
        });
        scene.input.on('pointermove', (pointer) => {
            // Don't process player movement input when dialog is open
            if (scene.isDialogOpen) return;

            // If we're ignoring pointer events until release, don't process
            if (this.ignorePointerUntilRelease) return;

            if (!pointer.isDown) return; // Only process if pointer is down
            if (!this.isDragging) {
                const dx = pointer.x - this.touchStart.x;
                const dy = pointer.y - this.touchStart.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.threshold) {
                    this.isDragging = true;
                    this.target = scene.cameras.main.getWorldPoint(pointer.x, pointer.y); // Update target for drag
                }
            }
            if (this.isDragging) {
                this.target = scene.cameras.main.getWorldPoint(pointer.x, pointer.y); // Update target during drag
                this.recalcualtePath(); // Recalculate path to new drag position
                if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                    scene.uiManager.handlePointerMove(pointer.x, pointer.y, true);
                }
            }
        });
        scene.input.on('pointerup', (pointer) => {
            // Don't process player movement input when dialog is open
            if (scene.isDialogOpen) return;

            // Reset the ignore flag when button is released
            this.ignorePointerUntilRelease = false;

            // Keep target and path - don't clear them, just stop updating during drag
            this.isDragging = false;
            if (scene.uiManager && typeof scene.uiManager.handlePointerMove === 'function') {
                scene.uiManager.handlePointerMove(pointer.x, pointer.y, false);
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
        // Don't allow player movement when dialog is open
        if (this.scene.isDialogOpen) {
            // Clear any existing targets to prevent movement
            this.target = null;
            this.isDragging = false;
            return { x: 0, y: 0 };
        }

        // Don't allow movement if we're ignoring pointer events until release
        if (this.ignorePointerUntilRelease) {
            return { x: 0, y: 0 };
        }

        // Check if player is stuck and recalculate path if needed
        this.checkStuckAndRecalculate();

        let dir = { x: 0, y: 0 };

        // Keyboard priority
        if (this.cursors.left.isDown) dir.x = -1;
        else if (this.cursors.right.isDown) dir.x = 1;
        if (this.cursors.up.isDown) dir.y = -1;
        else if (this.cursors.down.isDown) dir.y = 1;

        // Tap-to-move target
        if (dir.x === 0 && dir.y === 0 && this.target) {
            // Use pathfinding waypoint if available
            let moveTarget = this.target;
            if (this.pathToTarget.length > 0 && this.pathIndex < this.pathToTarget.length) {
                moveTarget = this.pathToTarget[this.pathIndex];
                const wpDist = Math.sqrt(
                    Math.pow(moveTarget.x - this.scene.player.x, 2) +
                    Math.pow(moveTarget.y - this.scene.player.y, 2)
                );
                if (wpDist < 10) {
                    this.pathIndex++;
                    if (this.pathIndex >= this.pathToTarget.length) {
                        this.target = null;
                        this.pathToTarget = [];
                        this.pathIndex = 0;
                        return { x: 0, y: 0 };
                    }
                    moveTarget = this.pathToTarget[this.pathIndex];
                }
            }

            const dx = moveTarget.x - this.scene.player.x;
            const dy = moveTarget.y - this.scene.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 10) {
                // Reached current waypoint, advance to next
                if (this.pathToTarget.length > 0 && this.pathIndex < this.pathToTarget.length - 1) {
                    this.pathIndex++;
                    moveTarget = this.pathToTarget[this.pathIndex];
                    const newDx = moveTarget.x - this.scene.player.x;
                    const newDy = moveTarget.y - this.scene.player.y;
                    const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
                    dir.x = newDx / newDist;
                    dir.y = newDy / newDist;
                } else {
                    // Reached final destination
                    this.target = null;
                    this.pathToTarget = [];
                    this.pathIndex = 0;
                    return { x: 0, y: 0 };
                }
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

    /**
     * Simple grid-based pathfinding using BFS (Breadth-First Search)
     * Find next waypoint on path to target
     */
    getNextWaypoint() {
        if (!this.target) return null;

        const player = this.scene.player;
        const gridSize = this.gridSize;

        // If reached current waypoint, get next one
        if (this.pathIndex >= this.pathToTarget.length) {
            this.pathIndex = 0;
            this.pathToTarget = [];
            return null;
        }

        // Return current waypoint if path exists
        if (this.pathToTarget.length > 0 && this.pathIndex < this.pathToTarget.length) {
            return this.pathToTarget[this.pathIndex];
        }

        return null;
    }

    /**
     * Recalculate path using simple BFS with collision detection
     */
    recalcualtePath() {
        if (!this.target || !this.scene.player) return;

        const player = this.scene.player;
        const target = this.target;
        const gridSize = this.gridSize;
        const physics = this.scene.physics;

        // Convert to grid positions
        const startGrid = {
            x: Math.floor(player.x / gridSize),
            y: Math.floor(player.y / gridSize)
        };
        const endGrid = {
            x: Math.floor(target.x / gridSize),
            y: Math.floor(target.y / gridSize)
        };

        // Simple BFS pathfinding with collision layer
        const path = this.bfsPathfind(startGrid, endGrid);

        // Convert grid path back to world coordinates
        this.pathToTarget = path.map(point => ({
            x: point.x * gridSize + gridSize / 2,
            y: point.y * gridSize + gridSize / 2
        }));
        this.pathIndex = 0;
    }

    /**
     * Breadth-First Search pathfinding
     */
    bfsPathfind(start, end) {
        const queue = [start];
        const visited = new Set();
        const parent = new Map();
        const key = (p) => `${p.x},${p.y}`;

        visited.add(key(start));
        parent.set(key(start), null);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(node);
                    node = parent.get(key(node));
                }
                return path.slice(1); // Remove start position
            }

            // Check 8 adjacent cells (including diagonals for more efficient paths)
            const neighbors = [
                { x: current.x + 1, y: current.y },     // right
                { x: current.x - 1, y: current.y },     // left
                { x: current.x, y: current.y + 1 },     // down
                { x: current.x, y: current.y - 1 },     // up
                { x: current.x + 1, y: current.y + 1 }, // down-right
                { x: current.x + 1, y: current.y - 1 }, // up-right
                { x: current.x - 1, y: current.y + 1 }, // down-left
                { x: current.x - 1, y: current.y - 1 }  // up-left
            ];

            for (const neighbor of neighbors) {
                const neighborKey = key(neighbor);
                if (!visited.has(neighborKey) && this.isWalkable(neighbor)) {
                    visited.add(neighborKey);
                    parent.set(neighborKey, current);
                    queue.push(neighbor);
                }
            }
        }

        // No path found, return empty
        return [];
    }

    /**
     * Check if a grid cell is walkable (no collisions)
     */
    isWalkable(gridPos) {
        if (!this.scene.map) return true;

        const worldX = gridPos.x * this.gridSize + this.gridSize / 2;
        const worldY = gridPos.y * this.gridSize + this.gridSize / 2;

        // Check world bounds
        const map = this.scene.map;
        if (worldX < 0 || worldY < 0 || worldX > map.widthInPixels || worldY > map.heightInPixels) {
            return false;
        }

        // Check custom collision bodies (from CollisionManager)
        if (this.scene.customCollisionBodies) {
            for (const body of this.scene.customCollisionBodies) {
                const bodyBounds = body.getBounds();
                if (Phaser.Geom.Rectangle.ContainsPoint(bodyBounds, { x: worldX, y: worldY })) {
                    return false; // Collision body present
                }
            }
        }

        return true;
    }

    /**
     * Check if player is stuck and recalculate path if needed
     */
    checkStuckAndRecalculate() {
        if (!this.target || !this.scene.player) return;

        const currentPos = { x: this.scene.player.x, y: this.scene.player.y };
        const distFromLast = Math.sqrt(
            Math.pow(currentPos.x - this.lastPosition.x, 2) +
            Math.pow(currentPos.y - this.lastPosition.y, 2)
        );

        // If player hasn't moved much in the last few frames, they might be stuck
        if (distFromLast < 2) {
            this.stuckCounter++;
            if (this.stuckCounter > 30) { // About 0.5 seconds at 60fps
                // Player is stuck, recalculate path
                this.recalcualtePath();
                this.stuckCounter = 0;
            }
        } else {
            this.stuckCounter = 0;
        }

        this.lastPosition = { ...currentPos };
    }
}

export default InputManager;