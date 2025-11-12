/**
 * CameraManager.js
 * Handles Sierra-style screen transitions where the view shifts when player reaches screen edges
 */

class CameraManager {
    constructor(scene) {
        this.scene = scene;
        this.screenWidth = 960;  // Game viewport width
        this.screenHeight = 640; // Game viewport height

        // Current screen position (in screen units, not pixels)
        this.currentScreenX = 0;
        this.currentScreenY = 0;

        // Edge threshold (pixels from screen edge to trigger transition)
        this.edgeThreshold = 32;

        // Transition speed (pixels per frame)
        this.transitionSpeed = 16;

        // Track if we're currently panning
        this.isPanning = false;
        this.panTargetX = 0;
        this.panTargetY = 0;
        this.panSpeed = 8; // pixels per frame

        // Edge detection state management
        this.edgeDetectionEnabled = true;
        this.lastTransitionDirection = null; // Track which edge triggered the last transition
        this.transitionTriggerScreenX = 0; // Screen where transition was triggered
        this.transitionTriggerScreenY = 0;
        this.transitionTriggerPlayerX = 0; // Player position when transition was triggered
        this.transitionTriggerPlayerY = 0;
    }

    /**
     * Initialize the camera system
     */
    initialize() {
        // Set camera to fixed viewport size
        this.scene.cameras.main.setViewport(0, 0, this.screenWidth, this.screenHeight);

        // Ensure zoom is 1:1 (no zooming)
        this.scene.cameras.main.setZoom(1);

        // Set camera bounds to map size
        this.scene.cameras.main.setBounds(0, 0, this.scene.map.widthInPixels, this.scene.map.heightInPixels);

        // Always use Sierra-style screen-by-screen scrolling
        this.useSmoothScrolling = false;

        // Start at player position
        this.centerOnPlayer();

        console.log('CameraManager: Sierra-style camera initialized');
        console.log(`CameraManager: Map size: ${this.scene.map.widthInPixels}x${this.scene.map.heightInPixels}`);
        console.log(`CameraManager: Max screens: ${this.getMaxScreenX() + 1}x${this.getMaxScreenY() + 1}`);
    }

    /**
     * Update camera position based on player movement
     */
    update() {
        if (!this.scene.player) return;

        const player = this.scene.player;
        const camera = this.scene.cameras.main;
        const map = this.scene.map;

        // Get current viewport bounds
        const screenLeft = camera.scrollX;
        const screenRight = camera.scrollX + this.screenWidth;
        const screenTop = camera.scrollY;
        const screenBottom = camera.scrollY + this.screenHeight;

        if (this.scene.debugEnabled) {
            console.log(`Camera: Player at (${player.x.toFixed(1)}, ${player.y.toFixed(1)}), Scroll: (${screenLeft}, ${screenTop}), Panning: ${this.isPanning}`);
        }

        // Only trigger new pans if we're not already panning
        if (!this.isPanning) {
            let shouldPan = false;
            let panTargetX = screenLeft;
            let panTargetY = screenTop;

            // Calculate maximum valid scroll positions (ensuring viewport stays within map)
            const maxScrollX = Math.max(0, map.widthInPixels - this.screenWidth);
            const maxScrollY = Math.max(0, map.heightInPixels - this.screenHeight);

            // Check if player has left the edge detection zone (hysteresis)
            this.checkEdgeDetectionState(player, screenLeft, screenRight, screenTop, screenBottom);

            // Only check for edge triggers if edge detection is enabled
            if (this.edgeDetectionEnabled) {
                // Horizontal panning - pan toward the edges or by full screen width, whichever brings view closer to that edge
                if (player.x < screenLeft + this.edgeThreshold) {
                    // Player at left edge - pan left toward x=0 or by full screen width, whichever is less extreme
                    panTargetX = Math.max(0, screenLeft - this.screenWidth);
                    shouldPan = true;
                } else if (player.x > screenRight - this.edgeThreshold) {
                    // Player at right edge - pan right toward max scroll or by full screen width, whichever reaches closer to max
                    const panByFullScreen = screenLeft + this.screenWidth;
                    panTargetX = Math.min(maxScrollX, panByFullScreen);
                    shouldPan = true;
                }

                // Vertical panning - pan toward the edges or by full screen height, whichever brings view closer to that edge
                if (player.y < screenTop + this.edgeThreshold) {
                    // Player at top edge - pan up toward y=0 or by full screen height, whichever is less extreme
                    panTargetY = Math.max(0, screenTop - this.screenHeight);
                    shouldPan = true;
                } else if (player.y > screenBottom - this.edgeThreshold) {
                    // Player at bottom edge - pan down toward max scroll or by full screen height, whichever reaches closer to max
                    const panByFullScreen = screenTop + this.screenHeight;
                    panTargetY = Math.min(maxScrollY, panByFullScreen);
                    shouldPan = true;
                }
            }

            // Start panning if needed
            if (shouldPan && (panTargetX !== screenLeft || panTargetY !== screenTop)) {
                this.isPanning = true;
                this.panTargetX = panTargetX;
                this.panTargetY = panTargetY;
                // Disable edge detection during pan (hysteresis)
                this.edgeDetectionEnabled = false;
                this.transitionTriggerPlayerX = player.x;
                this.transitionTriggerPlayerY = player.y;
                if (this.scene.debugEnabled) {
                    console.log(`Camera: Starting pan to (${panTargetX}, ${panTargetY}), edge detection disabled`);
                }
            }
        }

        // Update panning animation
        if (this.isPanning) {
            let newScrollX = screenLeft;
            let newScrollY = screenTop;
            let panComplete = true;

            // Smooth pan horizontally
            if (Math.abs(this.panTargetX - screenLeft) > 0.1) {
                const deltaX = this.panTargetX - screenLeft;
                const moveX = Math.sign(deltaX) * Math.min(this.panSpeed, Math.abs(deltaX));
                newScrollX = screenLeft + moveX;
                panComplete = false;
            } else {
                newScrollX = this.panTargetX;
            }

            // Smooth pan vertically
            if (Math.abs(this.panTargetY - screenTop) > 0.1) {
                const deltaY = this.panTargetY - screenTop;
                const moveY = Math.sign(deltaY) * Math.min(this.panSpeed, Math.abs(deltaY));
                newScrollY = screenTop + moveY;
                panComplete = false;
            } else {
                newScrollY = this.panTargetY;
            }

            // Apply new scroll position
            camera.setScroll(newScrollX, newScrollY);

            // Mark pan as complete if we've reached target
            if (panComplete) {
                this.isPanning = false;
                if (this.scene.debugEnabled) {
                    console.log(`Camera: Pan complete at (${newScrollX}, ${newScrollY})`);
                }
            }
        }

        // Clamp player to prevent leaving the viewport, but allow reaching map boundaries
        const margin = this.edgeThreshold;
        const clampedLeft = Math.max(0, screenLeft + margin);
        const clampedRight = Math.min(map.widthInPixels, screenRight - margin);
        const clampedTop = Math.max(0, screenTop + margin);
        const clampedBottom = Math.min(map.heightInPixels, screenBottom - margin);

        // Use actual map boundaries for clamping instead of viewport-relative boundaries
        player.x = Phaser.Math.Clamp(player.x, 0, map.widthInPixels);
        player.y = Phaser.Math.Clamp(player.y, 0, map.heightInPixels);
    }

    /**
     * Check if edge detection should be re-enabled based on player position
     */
    checkEdgeDetectionState(player, screenLeft, screenRight, screenTop, screenBottom) {
        if (this.edgeDetectionEnabled) {
            return; // Already enabled
        }

        // Re-enable edge detection only when player is safely away from all edges
        const safeZone = 80; // Must be this far from all edges to re-enable detection
        const isSafeFromLeft = player.x >= screenLeft + safeZone;
        const isSafeFromRight = player.x <= screenRight - safeZone;
        const isSafeFromTop = player.y >= screenTop + safeZone;
        const isSafeFromBottom = player.y <= screenBottom - safeZone;

        if (isSafeFromLeft && isSafeFromRight && isSafeFromTop && isSafeFromBottom) {
            this.edgeDetectionEnabled = true;
            this.transitionTriggerPlayerX = 0;
            this.transitionTriggerPlayerY = 0;
            if (this.scene.debugEnabled) {
                console.log(`CameraManager: Edge detection re-enabled (player in safe zone)`);
            }
        }
    }

    /**
     * Start a screen transition
     */
    startTransition(targetScreenX, targetScreenY, direction) {
        if (this.useSmoothScrolling) return; // No transitions in smooth scrolling mode

        this.isTransitioning = true;
        this.targetScreenX = targetScreenX;
        this.targetScreenY = targetScreenY;

        // Store trigger information for hysteresis
        this.transitionTriggerScreenX = this.currentScreenX;
        this.transitionTriggerScreenY = this.currentScreenY;
        this.transitionTriggerPlayerX = this.scene.player.x;
        this.transitionTriggerPlayerY = this.scene.player.y;

        // Disable edge detection until player leaves the triggering zone
        this.edgeDetectionEnabled = false;
        this.lastTransitionDirection = direction;

        console.log(`CameraManager: Transitioning to screen (${targetScreenX}, ${targetScreenY}) from ${direction} edge`);
    }

    /**
     * Update transition animation
     */
    updateTransition() {
        // Proportional scrolling doesn't use discrete transitions
        return;
    }

    /**
     * Center camera on player (for initial setup)
     */
    centerOnPlayer() {
        if (!this.scene.player) return;

        const player = this.scene.player;
        const camera = this.scene.cameras.main;

        // Calculate which screen the player is on
        this.currentScreenX = Math.floor(player.x / this.screenWidth);
        this.currentScreenY = Math.floor(player.y / this.screenHeight);

        // Clamp to valid screen positions
        this.currentScreenX = Phaser.Math.Clamp(this.currentScreenX, 0, this.getMaxScreenX());
        this.currentScreenY = Phaser.Math.Clamp(this.currentScreenY, 0, this.getMaxScreenY());

        // Set camera position
        const targetX = this.currentScreenX * this.screenWidth;
        const targetY = this.currentScreenY * this.screenHeight;

        camera.setScroll(targetX, targetY);
    }

    /**
     * Get maximum screen X position
     */
    getMaxScreenX() {
        return Math.max(0, Math.floor(this.scene.map.widthInPixels / this.screenWidth) - 1);
    }

    /**
     * Get maximum screen Y position
     */
    getMaxScreenY() {
        return Math.max(0, Math.floor(this.scene.map.heightInPixels / this.screenHeight) - 1);
    }

    /**
     * Force camera to specific screen position
     */
    setScreen(screenX, screenY) {
        this.currentScreenX = Phaser.Math.Clamp(screenX, 0, this.getMaxScreenX());
        this.currentScreenY = Phaser.Math.Clamp(screenY, 0, this.getMaxScreenY());

        const targetX = this.currentScreenX * this.screenWidth;
        const targetY = this.currentScreenY * this.screenHeight;

        this.scene.cameras.main.setScroll(targetX, targetY);
        this.isTransitioning = false;
    }

    /**
     * Get current screen coordinates
     */
    getCurrentScreen() {
        return { x: this.currentScreenX, y: this.currentScreenY };
    }

    /**
     * Check if camera is currently transitioning
     */
    isCurrentlyTransitioning() {
        return this.isTransitioning;
    }
}

export default CameraManager;