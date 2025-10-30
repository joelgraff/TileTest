class VendorInteraction {
    constructor(scene, vendorManager) {
        this.scene = scene;
        this.vendorManager = vendorManager;
        this.interactionRange = 60;
        this.nearbyVendor = null;
        this.setupInteractionPrompt();
    }

    setupInteractionPrompt() {
        this.interactionPrompt = this.scene.add.text(400, 100, 'PRESS SPACE TO TALK', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            backgroundColor: '#000080',
            padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(150)
        .setVisible(false);

        this.scene.input.keyboard.on('keydown-SPACE', () => {
            if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
                this.vendorManager.interactWithVendor(this.nearbyVendor.vendorData, this.nearbyVendor);
            }
        });

        // Global mouse click handler for vendors
        this.scene.input.on('pointerdown', (pointer) => {
            if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
                const bounds = this.nearbyVendor.getBounds();
                if (Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY)) {
                    // Clear any existing input state to prevent player movement
                    if (this.scene.inputManager) {
                        this.scene.inputManager.target = null;
                        this.scene.inputManager.isDragging = false;
                        this.scene.inputManager.direction = { x: 0, y: 0 };
                    }
                    this.vendorManager.interactWithVendor(this.nearbyVendor.vendorData, this.nearbyVendor);
                }
            }
        });
    }

    update() {
        if (!this.scene.player || !this.scene.npcGroup) return;

        this.nearbyVendor = null;

        // Clear all effects
        this.scene.npcGroup.getChildren().forEach(npcSprite => {
            if (npcSprite.glowGraphic) npcSprite.glowGraphic.setVisible(false);
        });

        // Find the closest vendor in range
        let closestVendor = null;
        let closestDistance = this.interactionRange;

        this.scene.npcGroup.getChildren().forEach(npcSprite => {
            if (!npcSprite.vendorData) return;

            const distance = Phaser.Math.Distance.Between(
                this.scene.player.x,
                this.scene.player.y,
                npcSprite.x,
                npcSprite.y
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestVendor = npcSprite;
            }
        });

        // Apply effect to the closest one
        if (closestVendor) {
            this.nearbyVendor = closestVendor;
            this.interactionPrompt.x = closestVendor.x - this.scene.cameras.main.scrollX;
            this.interactionPrompt.y = closestVendor.y - this.scene.cameras.main.scrollY - 40;

            // Pulsing circular glow effect
            if (closestVendor.glowGraphic) {
                closestVendor.glowPulse = (closestVendor.glowPulse || 0) + 0.08;
                const pulse = 0.7 + 0.3 * Math.sin(closestVendor.glowPulse);
                closestVendor.glowGraphic.clear();
                closestVendor.glowGraphic.fillStyle(0x00FFFF, 0.25 + 0.25 * pulse);
                closestVendor.glowGraphic.fillCircle(
                    closestVendor.x,
                    closestVendor.y,
                    (closestVendor.displayWidth * 0.7) + (closestVendor.displayWidth * 0.3 * pulse)
                );
                closestVendor.glowGraphic.setVisible(true);
            }
        } else {
            this.nearbyVendor = null;
        }

        if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }
}

export default VendorInteraction;