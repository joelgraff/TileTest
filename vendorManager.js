class VendorManager {
    constructor(scene) {
        this.scene = scene;
        this.vendors = [];
        this.interactionRange = 60;
        this.nearbyVendor = null;
        this.vendorAssignmentDone = false;

        this.loadVendors();
        this.setupInteractionPrompt();
    }

    async loadVendors() {
        try {
            this.vendors = this.scene.vendors;
            this.tryAssignVendorData();
        } catch (error) {
            console.error('Failed to load vendor data:', error);
        }
    }

    tryAssignVendorData() {
        if (this.vendorAssignmentDone) return;
        if (!this.scene.npcGroup || !this.vendors.length) return;

        const availableVendors = [...this.vendors];
        this.scene.npcGroup.getChildren().forEach(npcSprite => {
            let vendor;
            if (availableVendors.length > 0) {
                const idx = Math.floor(Math.random() * availableVendors.length);
                vendor = availableVendors.splice(idx, 1)[0];
            } else {
                vendor = this.vendors[Math.floor(Math.random() * this.vendors.length)];
            }
            npcSprite.vendorData = vendor;

            // Always assign pulsing glow effect
            npcSprite.interactionEffect = 1;

            // Create a graphics object for the pulsing glow
            if (npcSprite.glowGraphic) {
                npcSprite.glowGraphic.destroy();
            }
            const glow = this.scene.add.graphics();
            glow.setDepth(npcSprite.depth ? npcSprite.depth - 1 : 0);
            glow.setVisible(false);
            npcSprite.glowGraphic = glow;
            npcSprite.glowPulse = 0;
        });
        this.vendorAssignmentDone = true;
    }

    update() {
        this.tryAssignVendorData();

        if (!this.scene.player || !this.scene.npcGroup) return;

        this.nearbyVendor = null;

        // First, clear all effects
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
                closestVendor.glowGraphic.fillStyle(0x00FFFF, 0.25 + 0.25 * pulse); // Cyan, pulsing alpha
                closestVendor.glowGraphic.fillCircle(
                    closestVendor.x,
                    closestVendor.y,
                    (closestVendor.displayWidth * 0.7) + (closestVendor.displayWidth * 0.3 * pulse)
                );
                closestVendor.glowGraphic.setVisible(true);
            }
        }

        if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
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
                this.interactWithVendor(this.nearbyVendor.vendorData);
            }
        });
    }
/*
    update() {
        this.tryAssignVendorData();

        if (!this.scene.player || !this.scene.npcGroup) return;

        this.nearbyVendor = null;

        this.scene.npcGroup.getChildren().forEach(npcSprite => {
            if (!npcSprite.vendorData) {
                // Remove all effects if not a vendor
                npcSprite.clearTint && npcSprite.clearTint();
                if (npcSprite.outlineGraphic) npcSprite.outlineGraphic.setVisible(false);
                npcSprite.setScale && npcSprite.setScale(1);
                return;
            }

            const distance = Phaser.Math.Distance.Between(
                this.scene.player.x,
                this.scene.player.y,
                npcSprite.x,
                npcSprite.y
            );

            // Remove effects if not in range
            if (distance >= this.interactionRange) {
                npcSprite.clearTint && npcSprite.clearTint();
                if (npcSprite.outlineGraphic) npcSprite.outlineGraphic.setVisible(false);
                npcSprite.setScale && npcSprite.setScale(1);
                return;
            }

            // Apply effect if in range
            this.nearbyVendor = npcSprite;
            this.interactionPrompt.x = npcSprite.x - this.scene.cameras.main.scrollX;
            this.interactionPrompt.y = npcSprite.y - this.scene.cameras.main.scrollY - 40;

            switch (npcSprite.interactionEffect) {
                case 0: // Tint
                    npcSprite.setTint(0xFFFF00);
                    break;
                case 1: // Outline
                    if (npcSprite.outlineGraphic) {
                        npcSprite.outlineGraphic.setVisible(true);
                        npcSprite.outlineGraphic.x = npcSprite.x - npcSprite.displayWidth / 2 - 2;
                        npcSprite.outlineGraphic.y = npcSprite.y - npcSprite.displayHeight / 2 - 2;
                    }
                    break;
                case 2: // Bounce/scale
                    npcSprite.setScale(1.2);
                    break;
            }
        });

        if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }
*/
    interactWithVendor(vendorData) {
        if (!vendorData) return;
        this.interactionPrompt.setVisible(false);

        const dialogData = {
            imageKey: vendorData.imageKey || 'npc1',
            text: `Welcome to ${vendorData.name}!\n${vendorData.description || ''}`,
            buttons: [
                ...(vendorData.items && vendorData.items.length > 0
                    ? [{
                        label: `Buy ${vendorData.items[0].name}`,
                        onClick: () => {
                            if (this.scene.uiManager.addItem(vendorData.items[0])) {
                                console.log(`Added ${vendorData.items[0].name} to inventory`);
                            }
                        }
                    }]
                    : []),
                {
                    label: 'Leave',
                    onClick: () => {
                        this.scene.uiManager.closeDialog();
                    }
                }
            ]
        };

        this.scene.uiManager.showDialog(dialogData);
    }
}

export default VendorManager;