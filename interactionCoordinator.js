class InteractionCoordinator {
    constructor(scene, {
        vendorManager = null,
        inputManager = null,
        uiManager = null,
        handleUiInput = null,
        suppressPointerUntilRelease = null
    } = {}) {
        this.scene = scene;
        this.vendorManager = vendorManager;
        this.handleUiInput = handleUiInput ?? uiManager?.handleInput?.bind(uiManager) ?? null;
        this.suppressPointerUntilRelease = suppressPointerUntilRelease
            ?? inputManager?.suppressPointerUntilRelease?.bind(inputManager)
            ?? null;
        this.debugToggleHandler = null;

        this.bindInteractionInputs();
    }

    setDebugToggleHandler(debugToggleHandler) {
        this.debugToggleHandler = debugToggleHandler;
        return this;
    }

    bindInteractionInputs() {
        this.scene.input.keyboard.on('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }

    handlePointerDown(pointer) {
        return this.interactWithNearbyVendor(pointer);
    }

    handleKeyDown(event = {}) {
        if (event.repeat) {
            return false;
        }

        const code = event.code ?? '';
        const key = typeof event.key === 'string' ? event.key : '';

        if (code === 'Space' || key === ' ' || key === 'Spacebar') {
            event.preventDefault?.();
            return this.interactWithNearbyVendor();
        }

        if (code === 'KeyI' || key === 'i' || key === 'I') {
            event.preventDefault?.();
            this.handleUiInput?.('I');
            return true;
        }

        if (code === 'KeyQ' || key === 'q' || key === 'Q') {
            event.preventDefault?.();
            this.handleUiInput?.('Q');
            return true;
        }

        if (code === 'Escape' || key === 'Escape' || key === 'Esc') {
            event.preventDefault?.();
            this.handleUiInput?.('ESCAPE');
            return true;
        }

        if (code === 'Backquote' || key === '`') {
            event.preventDefault?.();
            this.debugToggleHandler?.();
            return Boolean(this.debugToggleHandler);
        }

        return false;
    }

    getNearbyVendorForInteraction(pointer = null) {
        const nearbyVendor = this.vendorManager?.nearbyVendor;
        if (!nearbyVendor || !this.vendorManager?.isInteractionAvailable()) {
            return null;
        }

        if (!pointer) {
            return nearbyVendor;
        }

        const bounds = nearbyVendor.getBounds();
        if (!Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY)) {
            return null;
        }

        return nearbyVendor;
    }

    interactWithNearbyVendor(pointer = null) {
        const nearbyVendor = this.getNearbyVendorForInteraction(pointer);
        if (!nearbyVendor) {
            return false;
        }

        if (pointer) {
            this.suppressPointerUntilRelease?.();
        }

        return this.vendorManager?.interactWithVendorSprite?.(nearbyVendor) ?? false;
    }
}

export default InteractionCoordinator;