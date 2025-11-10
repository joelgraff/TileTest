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

        // Track if we're currently transitioning
        this.isTransitioning = false;
        this.targetScreenX = 0;
        this.targetScreenY = 0;

        // Edge detection state management
        this.edgeDetectionEnabled = true;
        this.lastTransitionDirection = null; // Track which edge triggered the last transition
    }

    /**
     * Initialize the camera system
     */
    initialize() {
        // Set camera to fixed viewport size
        this.scene.cameras.main.setViewport(0, 0, this.screenWidth, this.screenHeight);

        // Set camera bounds to map size
        this.scene.cameras.main.setBounds(0, 0, this.scene.map.widthInPixels, this.scene.map.heightInPixels);

        // Start at player position
        this.centerOnPlayer();

        console.log('CameraManager: Sierra-style camera initialized');
        console.log(`CameraManager: Map size: ${this.scene.map.widthInPixels}x${this.scene.map.heightInPixels}`);
        console.log(`CameraManager: Max screens: ${this.getMaxScreenX() + 1}x${this.getMaxScreenY() + 1}`);
        console.log(`CameraManager: Starting screen: (${this.currentScreenX}, ${this.currentScreenY})`);
    }

    /**
     * Update camera position based on player movement
     */
    update() {
        if (!this.scene.player || this.isTransitioning) return;

        const player = this.scene.player;
        const camera = this.scene.cameras.main;

        // Get player's position relative to current screen
        const screenLeft = camera.scrollX;
        const screenRight = camera.scrollX + this.screenWidth;
        const screenTop = camera.scrollY;
        const screenBottom = camera.scrollY + this.screenHeight;

        if (this.scene.debugEnabled) {
            console.log(`Camera: Player at (${player.x.toFixed(1)}, ${player.y.toFixed(1)}), Screen: [${screenLeft}-${screenRight}, ${screenTop}-${screenBottom}], EdgeDetect: ${this.edgeDetectionEnabled}`);
        }

        // Check if we should re-enable edge detection
        this.checkEdgeDetectionState(player, screenLeft, screenRight, screenTop, screenBottom);

        // Only check for transitions if edge detection is enabled
        if (!this.edgeDetectionEnabled) return;

        // Check if player is near screen edges
        let shouldTransition = false;
        let newScreenX = this.currentScreenX;
        let newScreenY = this.currentScreenY;
        let transitionDirection = null;

        // Left edge
        if (player.x < screenLeft + this.edgeThreshold) {
            newScreenX = Math.max(0, this.currentScreenX - 1);
            shouldTransition = true;
            transitionDirection = 'left';
        }
        // Right edge
        else if (player.x > screenRight - this.edgeThreshold) {
            newScreenX = Math.min(this.getMaxScreenX(), this.currentScreenX + 1);
            shouldTransition = true;
            transitionDirection = 'right';
        }

        // Top edge
        if (player.y < screenTop + this.edgeThreshold) {
            newScreenY = Math.max(0, this.currentScreenY - 1);
            shouldTransition = true;
            transitionDirection = 'up';
        }
        // Bottom edge
        else if (player.y > screenBottom - this.edgeThreshold) {
            newScreenY = Math.min(this.getMaxScreenY(), this.currentScreenY + 1);
            shouldTransition = true;
            transitionDirection = 'down';
        }

        if (this.scene.debugEnabled && shouldTransition) {
            console.log(`Camera: Should transition ${transitionDirection} to screen (${newScreenX}, ${newScreenY})`);
        }

        // Start transition if needed
        if (shouldTransition && (newScreenX !== this.currentScreenX || newScreenY !== this.currentScreenY)) {
            this.startTransition(newScreenX, newScreenY, transitionDirection);
        }

        // Constrain player to current screen to prevent going off-screen, but only when edge detection is enabled
        if (this.edgeDetectionEnabled) {
            const margin = this.edgeThreshold;
            player.x = Phaser.Math.Clamp(player.x, screenLeft + margin, screenRight - margin);
            player.y = Phaser.Math.Clamp(player.y, screenTop + margin, screenBottom - margin);
        }
    }

    /**
     * Check if edge detection should be re-enabled based on player position relative to triggering edge
     */
    checkEdgeDetectionState(player, screenLeft, screenRight, screenTop, screenBottom) {
        if (this.edgeDetectionEnabled || !this.lastTransitionDirection) {
            return;
        }

        const buffer = 50; // Additional buffer beyond edge threshold
        let shouldReEnable = false;

        switch (this.lastTransitionDirection) {
            case 'left':
                // Re-enable if player moves right of the left edge plus buffer
                if (player.x > screenLeft + this.edgeThreshold + buffer) {
                    shouldReEnable = true;
                }
                break;
            case 'right':
                // Re-enable if player moves left of the right edge minus buffer
                if (player.x < screenRight - this.edgeThreshold - buffer) {
                    shouldReEnable = true;
                }
                break;
            case 'up':
                // Re-enable if player moves down of the top edge plus buffer
                if (player.y > screenTop + this.edgeThreshold + buffer) {
                    shouldReEnable = true;
                }
                break;
            case 'down':
                // Re-enable if player moves up of the bottom edge minus buffer
                if (player.y < screenBottom - this.edgeThreshold - buffer) {
                    shouldReEnable = true;
                }
                break;
        }

        if (shouldReEnable) {
            this.edgeDetectionEnabled = true;
            this.lastTransitionDirection = null;
            this.transitionTriggerBounds = null;
            this.transitionTriggerPlayerPos = null;
            if (this.scene.debugEnabled) {
                console.log('CameraManager: Edge detection re-enabled');
            }
        }
    }

    /**
     * Start a screen transition
     */
    startTransition(targetScreenX, targetScreenY, direction) {
        this.isTransitioning = true;
        this.targetScreenX = targetScreenX;
        this.targetScreenY = targetScreenY;

        // Disable edge detection until player leaves the triggering zone
        this.edgeDetectionEnabled = false;
        this.lastTransitionDirection = direction;

        console.log(`CameraManager: Transitioning to screen (${targetScreenX}, ${targetScreenY}) from ${direction} edge`);
    }

    /**
     * Update transition animation
     */
    updateTransition() {
        if (!this.isTransitioning) return;

        const camera = this.scene.cameras.main;
        const targetX = this.targetScreenX * this.screenWidth;
        const targetY = this.targetScreenY * this.screenHeight;

        const currentX = camera.scrollX;
        const currentY = camera.scrollY;

        // Calculate movement
        let deltaX = targetX - currentX;
        let deltaY = targetY - currentY;

        // Check if we're close enough to snap to target
        if (Math.abs(deltaX) < this.transitionSpeed && Math.abs(deltaY) < this.transitionSpeed) {
            camera.setScroll(targetX, targetY);
            this.currentScreenX = this.targetScreenX;
            this.currentScreenY = this.targetScreenY;
            this.isTransitioning = false;
            console.log(`CameraManager: Transition complete to screen (${this.currentScreenX}, ${this.currentScreenY})`);
            // Note: Edge detection remains disabled until player leaves the triggering zone
        } else {
            // Move towards target
            const moveX = Math.sign(deltaX) * Math.min(this.transitionSpeed, Math.abs(deltaX));
            const moveY = Math.sign(deltaY) * Math.min(this.transitionSpeed, Math.abs(deltaY));

            camera.setScroll(currentX + moveX, currentY + moveY);
        }
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