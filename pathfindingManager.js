class PathfindingManager {
    constructor(scene) {
        this.scene = scene;
        this.pathToTarget = []; // Path for pathfinding
        this.pathIndex = 0; // Current step in path
        this.gridSize = 32; // Tile size for pathfinding
        this.lastPosition = { x: 0, y: 0 }; // Track last position for stuck detection
        this.stuckCounter = 0; // Counter for stuck detection
        this.pathfindingAttempts = 0; // Track pathfinding attempts
        this.maxPathfindingAttempts = 3; // Max attempts before giving up
        this.useDirectMovement = false; // Flag for direct movement fallback
        this.target = null; // Current target position
        this.originalTarget = null; // Original target when using intermediate positions
    }

    /**
     * Set a new target for pathfinding
     */
    setTarget(target) {
        this.target = target;
        this.originalTarget = target; // Store original target
        this.pathfindingAttempts = 0;
        this.useDirectMovement = false;
        this.recalcualtePath();
    }

    /**
     * Clear the current target
     */
    clearTarget() {
        this.target = null;
        this.originalTarget = null;
        this.pathToTarget = [];
        this.pathIndex = 0;
        this.useDirectMovement = false;
    }

    /**
     * Get movement direction toward target
     */
    getDirection(player) {
        if (!this.target) return { x: 0, y: 0 };

        // Check if player is stuck and handle pathfinding failure
        this.checkStuckAndRecalculate(player);

        let dir = { x: 0, y: 0 };

        if (this.useDirectMovement) {
            // Direct movement mode: move straight toward target but stop at obstacles
            return this.handleDirectMovement(player);
        } else {
            // Pathfinding mode: use waypoints
            return this.handlePathfindingMovement(player);
        }
    }

    /**
     * Handle movement using pathfinding waypoints
     */
    handlePathfindingMovement(player) {
        const dir = { x: 0, y: 0 };

        // Safety check: ensure we have a valid target
        if (!this.target) {
            return { x: 0, y: 0 };
        }

        // Use pathfinding waypoint if available
        let moveTarget = this.target;
        if (this.pathToTarget.length > 0 && this.pathIndex < this.pathToTarget.length) {
            const waypoint = this.pathToTarget[this.pathIndex];
            if (waypoint) { // Safety check for valid waypoint
                moveTarget = waypoint;
                const wpDist = Math.sqrt(
                    Math.pow(moveTarget.x - player.x, 2) +
                    Math.pow(moveTarget.y - player.y, 2)
                );
                if (wpDist < 10) {
                    this.pathIndex++;
                    if (this.pathIndex >= this.pathToTarget.length) {
                        this.clearTarget();
                        return { x: 0, y: 0 };
                    }
                    const nextWaypoint = this.pathToTarget[this.pathIndex];
                    if (nextWaypoint) { // Safety check for next waypoint
                        moveTarget = nextWaypoint;
                    } else {
                        // Invalid waypoint, clear target
                        this.clearTarget();
                        return { x: 0, y: 0 };
                    }
                }
            } else {
                // Invalid waypoint, clear target
                this.clearTarget();
                return { x: 0, y: 0 };
            }
        }

        // Safety check: ensure moveTarget is valid
        if (!moveTarget || typeof moveTarget.x !== 'number' || typeof moveTarget.y !== 'number') {
            this.clearTarget();
            return { x: 0, y: 0 };
        }

        const dx = moveTarget.x - player.x;
        const dy = moveTarget.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
            // Reached current waypoint, advance to next
            if (this.pathToTarget.length > 0 && this.pathIndex < this.pathToTarget.length - 1) {
                this.pathIndex++;
                const nextWaypoint = this.pathToTarget[this.pathIndex];
                if (nextWaypoint && typeof nextWaypoint.x === 'number' && typeof nextWaypoint.y === 'number') {
                    moveTarget = nextWaypoint;
                    const newDx = moveTarget.x - player.x;
                    const newDy = moveTarget.y - player.y;
                    const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
                    dir.x = newDx / newDist;
                    dir.y = newDy / newDist;
                } else {
                    // Invalid next waypoint, clear target
                    this.clearTarget();
                    return { x: 0, y: 0 };
                }
            } else {
                // Reached final destination
                this.clearTarget();
                return { x: 0, y: 0 };
            }
        } else {
            dir.x = dx / dist;
            dir.y = dy / dist;
        }

        return dir;
    }

    /**
     * Handle direct movement toward target, stopping at obstacles
     */
    handleDirectMovement(player) {
        const dir = { x: 0, y: 0 };

        // Safety check: ensure we have a valid target
        if (!this.target || typeof this.target.x !== 'number' || typeof this.target.y !== 'number') {
            this.clearTarget();
            return { x: 0, y: 0 };
        }

        const dx = this.target.x - player.x;
        const dy = this.target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Use different stopping distances based on whether this is an intermediate target
        const isIntermediateTarget = this.target !== this.originalTarget;
        const stopDistance = isIntermediateTarget ? 5 : 1; // Much closer stopping distance for final targets

        if (dist < stopDistance) {
            // Reached destination (or closest reachable position)
            this.clearTarget();
            return { x: 0, y: 0 };
        }

        // Check if path ahead is blocked
        const checkDistance = 16; // Check 16 pixels ahead
        const checkX = player.x + (dx / dist) * checkDistance;
        const checkY = player.y + (dy / dist) * checkDistance;

        // Check if the position ahead is walkable
        const gridPos = {
            x: Math.floor(checkX / this.gridSize),
            y: Math.floor(checkY / this.gridSize)
        };

        if (!this.isWalkable(gridPos)) {
            // Path is blocked, find closest walkable position to target
            const closestWalkable = this.findClosestWalkablePosition(player, this.target);
            if (closestWalkable) {
                // Check if we're already at or very close to the closest walkable position
                const distToClosest = Math.sqrt(
                    Math.pow(closestWalkable.x - player.x, 2) +
                    Math.pow(closestWalkable.y - player.y, 2)
                );

                if (distToClosest < 10) {
                    // Already at closest position, stop
                    this.clearTarget();
                    return { x: 0, y: 0 };
                } else {
                    // Set intermediate target to closest walkable position
                    this.target = closestWalkable;
                    // Recalculate direction toward new target
                    const newDx = this.target.x - player.x;
                    const newDy = this.target.y - player.y;
                    const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
                    dir.x = newDx / newDist;
                    dir.y = newDy / newDist;
                }
            } else {
                // No walkable position found, stop
                this.clearTarget();
                return { x: 0, y: 0 };
            }
        } else {
            // Path is clear, move toward target
            dir.x = dx / dist;
            dir.y = dy / dist;
        }

        return dir;
    }

    /**
     * Check if player is stuck and recalculate path if needed
     */
    checkStuckAndRecalculate(player) {
        if (!this.target || !player) return;

        const currentPos = { x: player.x, y: player.y };
        const distFromLast = Math.sqrt(
            Math.pow(currentPos.x - this.lastPosition.x, 2) +
            Math.pow(currentPos.y - this.lastPosition.y, 2)
        );

        // If player hasn't moved much in the last few frames, they might be stuck
        if (distFromLast < 3) { // More sensitive than before
            this.stuckCounter++;
            if (this.stuckCounter > 15) { // Faster response - about 0.25 seconds at 60fps
                if (this.useDirectMovement) {
                    // Already in direct movement, give up
                    this.clearTarget();
                } else {
                    // Try pathfinding again
                    this.pathfindingAttempts++;
                    if (this.pathfindingAttempts >= this.maxPathfindingAttempts) {
                        // Give up on pathfinding, switch to direct movement
                        this.useDirectMovement = true;
                        this.pathToTarget = [];
                        this.pathIndex = 0;
                    } else {
                        // Try recalculating path
                        this.recalcualtePath();
                    }
                }
                this.stuckCounter = 0;
            }
        } else {
            this.stuckCounter = 0;
        }

        this.lastPosition = { ...currentPos };
    }

    /**
     * Recalculate path using simple BFS with collision detection
     */
    recalcualtePath() {
        if (!this.target || !this.scene.player) return;

        const player = this.scene.player;
        const target = this.target;
        const gridSize = this.gridSize;

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

        if (path.length === 0) {
            // No path found, switch to direct movement
            this.useDirectMovement = true;
            this.pathToTarget = [];
            this.pathIndex = 0;
        } else {
            // Path found, use it
            this.useDirectMovement = false;
            // Convert grid path back to world coordinates, filtering out any invalid points
            this.pathToTarget = path
                .filter(point => point && typeof point.x === 'number' && typeof point.y === 'number')
                .map(point => ({
                    x: point.x * gridSize + gridSize / 2,
                    y: point.y * gridSize + gridSize / 2
                }));
            this.pathIndex = 0;
        }
    }

    /**
     * Breadth-First Search pathfinding
     */
    bfsPathfind(start, end) {
        // Safety checks
        if (!start || !end || typeof start.x !== 'number' || typeof start.y !== 'number' ||
            typeof end.x !== 'number' || typeof end.y !== 'number') {
            return [];
        }

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
                // Safety check for neighbor validity
                if (neighbor && typeof neighbor.x === 'number' && typeof neighbor.y === 'number') {
                    const neighborKey = key(neighbor);
                    if (!visited.has(neighborKey) && this.isWalkable(neighbor)) {
                        visited.add(neighborKey);
                        parent.set(neighborKey, current);
                        queue.push(neighbor);
                    }
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
     * Find the closest walkable position to target along the line from player to target
     */
    findClosestWalkablePosition(player, target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const totalDist = Math.sqrt(dx * dx + dy * dy);

        if (totalDist === 0) return null;

        // Sample points along the line from target back to player
        // Start from target and work backwards in smaller steps for finer precision
        const stepSize = this.gridSize / 4; // Quarter grid size for even finer precision
        const steps = Math.ceil(totalDist / stepSize);

        for (let i = 0; i <= steps; i++) {
            // Calculate position at this step (from target towards player)
            const ratio = i / steps; // 0 = target, 1 = player
            const x = target.x - dx * ratio;
            const y = target.y - dy * ratio;

            // Convert to grid position
            const gridPos = {
                x: Math.floor(x / this.gridSize),
                y: Math.floor(y / this.gridSize)
            };

            // Check if this grid position is walkable
            if (this.isWalkable(gridPos)) {
                // Also check adjacent positions to ensure we can actually reach it
                const adjacentPositions = [
                    gridPos, // current
                    { x: gridPos.x + 1, y: gridPos.y }, // right
                    { x: gridPos.x - 1, y: gridPos.y }, // left
                    { x: gridPos.x, y: gridPos.y + 1 }, // down
                    { x: gridPos.x, y: gridPos.y - 1 }  // up
                ];

                // If any adjacent position is walkable, this position is reachable
                for (const adjPos of adjacentPositions) {
                    if (this.isWalkable(adjPos)) {
                        // Return world coordinates
                        return {
                            x: gridPos.x * this.gridSize + this.gridSize / 2,
                            y: gridPos.y * this.gridSize + this.gridSize / 2
                        };
                    }
                }
            }
        }

        // No walkable position found
        return null;
    }

    /**
     * Find closest walkable position along the direct line from player to target
     */
    findClosestWalkableOnLine(player, target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const totalDist = Math.sqrt(dx * dx + dy * dy);

        // Sample points along the line from target back to player
        const stepSize = this.gridSize / 4; // Quarter grid size for finer precision
        const steps = Math.ceil(totalDist / stepSize);

        for (let i = 0; i <= steps; i++) {
            // Calculate position at this step (from target towards player)
            const ratio = i / steps; // 0 = target, 1 = player
            const x = target.x - dx * ratio;
            const y = target.y - dy * ratio;

            // Convert to grid position
            const gridPos = {
                x: Math.floor(x / this.gridSize),
                y: Math.floor(y / this.gridSize)
            };

            // Check if this grid position is walkable
            if (this.isWalkable(gridPos)) {
                // Also check adjacent positions to ensure we can actually reach it
                const adjacentPositions = [
                    gridPos, // current
                    { x: gridPos.x + 1, y: gridPos.y }, // right
                    { x: gridPos.x - 1, y: gridPos.y }, // left
                    { x: gridPos.x, y: gridPos.y + 1 }, // down
                    { x: gridPos.x, y: gridPos.y - 1 }  // up
                ];

                // If any adjacent position is walkable, this position is reachable
                for (const adjPos of adjacentPositions) {
                    if (this.isWalkable(adjPos)) {
                        // Return world coordinates
                        return {
                            x: gridPos.x * this.gridSize + this.gridSize / 2,
                            y: gridPos.y * this.gridSize + this.gridSize / 2
                        };
                    }
                }
            }
        }

        // No walkable position found on direct line
        return null;
    }

    /**
     * Find closest walkable position near the target using expanding search
     */
    findClosestWalkableNearTarget(player, target) {
        const targetGrid = {
            x: Math.floor(target.x / this.gridSize),
            y: Math.floor(target.y / this.gridSize)
        };

        // Search in expanding squares around the target
        const maxRadius = 10; // Search up to 10 tiles away

        for (let radius = 0; radius <= maxRadius; radius++) {
            // Check all positions at this radius
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Only check perimeter positions to avoid redundant center checks
                    if (radius > 0 && Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue;
                    }

                    const checkGrid = {
                        x: targetGrid.x + dx,
                        y: targetGrid.y + dy
                    };

                    if (this.isWalkable(checkGrid)) {
                        // Check if this position is reachable from player's current position
                        const worldPos = {
                            x: checkGrid.x * this.gridSize + this.gridSize / 2,
                            y: checkGrid.y * this.gridSize + this.gridSize / 2
                        };

                        // Try a quick BFS to see if we can reach this position
                        if (this.canReachPosition(player, worldPos)) {
                            return worldPos;
                        }
                    }
                }
            }
        }

        // If no reachable position found near target, try to find any walkable position
        // near the player that gets closer to the target
        return this.findBestWalkableNearPlayer(player, target);
    }

    /**
     * Check if player can reach a target position using quick BFS
     */
    canReachPosition(player, target) {
        const startGrid = {
            x: Math.floor(player.x / this.gridSize),
            y: Math.floor(player.y / this.gridSize)
        };
        const endGrid = {
            x: Math.floor(target.x / this.gridSize),
            y: Math.floor(target.y / this.gridSize)
        };

        // Quick BFS with limited depth to check reachability
        const queue = [startGrid];
        const visited = new Set();
        const key = (p) => `${p.x},${p.y}`;
        const maxDepth = 20; // Limit search depth

        visited.add(key(startGrid));

        let depth = 0;
        while (queue.length > 0 && depth < maxDepth) {
            const levelSize = queue.length;
            for (let i = 0; i < levelSize; i++) {
                const current = queue.shift();

                if (current.x === endGrid.x && current.y === endGrid.y) {
                    return true; // Found path
                }

                // Check adjacent cells (4-directional for speed)
                const neighbors = [
                    { x: current.x + 1, y: current.y },     // right
                    { x: current.x - 1, y: current.y },     // left
                    { x: current.x, y: current.y + 1 },     // down
                    { x: current.x, y: current.y - 1 }      // up
                ];

                for (const neighbor of neighbors) {
                    const neighborKey = key(neighbor);
                    if (!visited.has(neighborKey) && this.isWalkable(neighbor)) {
                        visited.add(neighborKey);
                        queue.push(neighbor);
                    }
                }
            }
            depth++;
        }

        return false; // No path found within depth limit
    }

    /**
     * Find the best walkable position near player that moves toward target
     */
    findBestWalkableNearPlayer(player, target) {
        const playerGrid = {
            x: Math.floor(player.x / this.gridSize),
            y: Math.floor(player.y / this.gridSize)
        };

        const targetGrid = {
            x: Math.floor(target.x / this.gridSize),
            y: Math.floor(target.y / this.gridSize)
        };

        // Search in expanding radius around player
        const maxRadius = 5;
        let bestPosition = null;
        let bestDistance = Infinity;

        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    // Only check perimeter
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue;
                    }

                    const checkGrid = {
                        x: playerGrid.x + dx,
                        y: playerGrid.y + dy
                    };

                    if (this.isWalkable(checkGrid)) {
                        // Calculate if this position gets us closer to target
                        const distToTarget = Math.sqrt(
                            Math.pow(checkGrid.x - targetGrid.x, 2) +
                            Math.pow(checkGrid.y - targetGrid.y, 2)
                        );

                        if (distToTarget < bestDistance) {
                            bestDistance = distToTarget;
                            bestPosition = {
                                x: checkGrid.x * this.gridSize + this.gridSize / 2,
                                y: checkGrid.y * this.gridSize + this.gridSize / 2
                            };
                        }
                    }
                }
            }

            // If we found a position that gets us closer, return it
            if (bestPosition) {
                return bestPosition;
            }
        }

        // No better position found, return null
        return null;
    }

    /**
     * Get current target
     */
    getTarget() {
        return this.target;
    }

    /**
     * Check if currently using direct movement
     */
    isUsingDirectMovement() {
        return this.useDirectMovement;
    }
}

export default PathfindingManager;