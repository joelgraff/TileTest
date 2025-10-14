import DomainManager from './domainManager.js';

class VendorManager {
    constructor(scene) {
        this.scene = scene;
        this.vendors = scene.vendors || [];
        this.interactionRange = 60;
        this.nearbyVendor = null;
        this.vendorAssignmentDone = false;

        this.assignVendorsToNPCs();
        this.setupInteractionPrompt();
    }

    assignVendorsToNPCs() {
        if (this.vendorAssignmentDone) return;
        if (!this.scene.npcGroup || !this.vendors.length) return;

        // Change to random assignment (matches original NPCManager behavior for consistency)
        this.scene.npcGroup.getChildren().forEach(npcSprite => {
            npcSprite.vendorData = this.vendors[Math.floor(Math.random() * this.vendors.length)];

            // Pulsing glow effect
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
                this.interactWithVendor(this.nearbyVendor.vendorData, this.nearbyVendor);
            }
        });

        // Global mouse click handler for vendors
        this.scene.input.on('pointerdown', (pointer) => {
            if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
                const bounds = this.nearbyVendor.getBounds();
                if (Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY)) {
                    this.interactWithVendor(this.nearbyVendor.vendorData, this.nearbyVendor);
                }
            }
        });
    }

    interactWithVendor(vendorData, npcSprite = null) {
        console.log('Attempting to interact with vendor:', vendorData);
        if (!vendorData) return;
        this.interactionPrompt.setVisible(false);

        // Use the NPC sprite's texture key if available, else fallback
        const imageKey = npcSprite ? npcSprite.texture.key : (vendorData.imageKey || 'npc1');

        // Separate response buttons from the exit button
        const responseButtons = vendorData.dialog.responses.filter(response => response.action !== 'end').map(response => ({
            label: response.text,
            onClick: () => {
                let newText = '';
                if (response.action === 'show_items') {
                    const domainItems = DomainManager.getDomainItems(vendorData.domain_id);
                    if (domainItems.length > 0) {
                        const itemButtons = domainItems.map((item, index) => ({
                            label: `Collect ${item.name}`,
                            onClick: () => {
                                if (this.scene.questManager) {
                                    const questUpdated = this.scene.questManager.checkItemCollection(item.name, vendorData.id);
                                    if (questUpdated) {
                                        this.scene.uiManager.showDialog({
                                            text: `Collected ${item.name}!\n\nQuest progress updated!`,
                                            buttons: [{
                                                label: 'Continue',
                                                onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                                            }]
                                        });
                                    } else {
                                        this.scene.uiManager.showDialog({
                                            text: `Collected ${item.name}!\n\n(Item added to your collection)`,
                                            buttons: [{
                                                label: 'Continue',
                                                onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                                            }]
                                        });
                                    }
                                } else {
                                    this.scene.uiManager.showDialog({
                                        text: `Collected ${item.name}!`,
                                        buttons: [{
                                            label: 'Continue',
                                            onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                                        }]
                                    });
                                }
                            }
                        }));

                        this.scene.uiManager.showDialog({
                            text: `Available items from ${DomainManager.getDomainName(vendorData.domain_id)}:`,
                            buttons: itemButtons.concat([{
                                label: 'Back',
                                onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                            }])
                        });
                        return;
                    } else {
                        newText = 'No items available at this time.';
                    }
                } else if (response.action === 'booth_info') {
                    newText = `Booth: ${vendorData.booth}\nDescription: ${vendorData.description}\nDomain: ${DomainManager.getDomainName(vendorData.domain_id)}`;
                } else if (response.action === 'tech_facts') {
                    const domainFacts = DomainManager.getDomainFacts(vendorData.domain_id);
                    if (domainFacts.length > 0) {
                        newText = DomainManager.getDomainName(vendorData.domain_id) + ' facts:\n\n';
                        newText += domainFacts.join('\n');
                    } else {
                        newText = 'No facts available at this time.';
                    }
                }
                this.scene.uiManager.showDialog({
                    text: newText,
                    buttons: [{
                        label: 'Back',
                        onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                    }]
                });
            }
        }));

        const exitButton = vendorData.dialog.responses.find(response => response.action === 'end') ? {
            label: vendorData.dialog.responses.find(response => response.action === 'end').text,
            onClick: () => this.scene.uiManager.closeDialog()
        } : null;  // Fallback if no 'end' action

        // Full dialog logic adapted from NPCManager (using DomainManager for items/facts)
        const originalDialogData = {
            imageKey: imageKey,
            title: vendorData.name,
            text: vendorData.description,  // Changed from 'description' to 'text' to match dialog system expectations
            buttons: responseButtons,  // Main button stack (response buttons)
            exitButton: exitButton  // Separate exit button for bottom positioning
        };
        this.scene.uiManager.showDialog(originalDialogData);
    }

    update() {
        this.assignVendorsToNPCs();

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

export default VendorManager;