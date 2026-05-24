class InteractionCoordinator {
    constructor(scene, { vendorManager = null, inputManager = null } = {}) {
        this.scene = scene;
        this.vendorManager = vendorManager;
        this.inputManager = inputManager;

        this.bindVendorInteractions();
    }

    bindVendorInteractions() {
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            this.interactWithNearbyVendor();
        });

        this.scene.input.on('pointerdown', (pointer) => {
            this.interactWithNearbyVendor(pointer);
        });
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
            this.inputManager?.suppressPointerUntilRelease?.();
        }

        return this.vendorManager?.interactWithVendorSprite?.(nearbyVendor) ?? false;
    }
}

export default InteractionCoordinator;