import { resolveMovementDirection, updateDragDirection } from './inputDirectionResolver.js';
import { registerPointerHandlers } from './inputPointerHandlers.js';

class InputManager {
    constructor(scene, { uiManager = null } = {}) {
        this.scene = scene;
        this.uiManager = uiManager;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.touchStart = { x: 0, y: 0 };
        this.touchEnd = { x: 0, y: 0 };
        this.threshold = 20; // Min drag distance
        this.direction = { x: 0, y: 0 };
        this.isDragging = false; // Track if drag is active
        this.target = null; // Target position for tap-to-move
        this.ignorePointerUntilRelease = false; // Ignore pointer events until button release

        registerPointerHandlers(this, scene);
    }

    forwardPointerMove(pointer, isDown) {
        this.uiManager?.handlePointerMove?.(pointer.x, pointer.y, isDown);
    }

    clearMovementState() {
        this.target = null;
        this.isDragging = false;
        this.direction = { x: 0, y: 0 };
    }

    hasMovementTarget() {
        return this.target !== null;
    }

    cancelMovementTarget() {
        this.clearMovementState();
    }

    prepareUiInteraction({ suppressPointer = false } = {}) {
        if (suppressPointer) {
            this.suppressPointerUntilRelease();
            return;
        }

        this.clearMovementState();
    }

    suppressPointerUntilRelease() {
        this.clearMovementState();
        this.ignorePointerUntilRelease = true;
    }

    releasePointerSuppression() {
        this.ignorePointerUntilRelease = false;
        return this;
    }

    updateDirection(pointer) {
        return updateDragDirection(this, pointer);
    }

    getDirection() {
        return resolveMovementDirection(this);
    }
}

export default InputManager;