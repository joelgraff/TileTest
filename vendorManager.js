import DomainManager from './domainManager.js';

class VendorManager {
    constructor(scene, { uiManager = null } = {}) {
        this.scene = scene;
        this.vendors = scene.vendors || [];
        this.uiManager = uiManager;
        this.interactionRange = 60;
        this.nearbyVendor = null;
        this.vendorAssignmentDone = false;

        this.assignVendorsToNPCs();
        this.createInteractionPrompt();
    }

    isInteractionAvailable() {
        return this.scene.interactionsEnabled && DomainManager.isLoaded() && !this.uiManager?.isDialogOpen;
    }

    assignVendorsToNPCs() {
        if (this.vendorAssignmentDone) return;
        if (!this.scene.npcGroup || !this.vendors.length) return;

        this.scene.npcGroup.getChildren().forEach((npcSprite, index) => {
            npcSprite.vendorData = this.getAssignedVendor(index);

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

    getAssignedVendor(index) {
        if (this.scene.testMode) {
            return this.vendors[index % this.vendors.length];
        }

        return this.vendors[Math.floor(Math.random() * this.vendors.length)];
    }

    createInteractionPrompt() {
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
    }

    interactWithVendorSprite(npcSprite = null) {
        const vendorData = npcSprite?.vendorData;
        if (!vendorData) {
            return false;
        }

        return this.interactWithVendor(vendorData, npcSprite);
    }

    interactWithVendor(vendorData, npcSprite = null) {
        console.log('Attempting to interact with vendor:', vendorData);
        if (!vendorData || !DomainManager.isLoaded() || !this.uiManager) {
            return false;
        }

        const uiManager = this.uiManager;
        this.interactionPrompt.setVisible(false);

        // Use the NPC sprite's texture key if available, else fallback
        const imageKey = npcSprite ? npcSprite.texture.key : (vendorData.imageKey || 'npc1');

        // Separate response buttons from the exit button
        const responseButtons = vendorData.dialog.responses
            .filter(response => response.action !== 'end' && response.text !== 'Tell me about your booth')
            .map(response => ({
            label: response.text,
            onClick: () => {
                let newText = '';
                if (response.action === 'show_items') {
                    const domainItems = DomainManager.getDomainItems(vendorData.domain_id);
                    if (domainItems.length > 0) {
                        const itemsPerPage = 4; // Show 4 items per page
                        const totalPages = Math.ceil(domainItems.length / itemsPerPage);

                        const showItemsDialog = (page = 0) => {
                            const startIndex = page * itemsPerPage;
                            const endIndex = Math.min(startIndex + itemsPerPage, domainItems.length);
                            const pageItems = domainItems.slice(startIndex, endIndex);

                            const itemButtons = pageItems.map((item, index) => ({
                                label: item.name,
                                onClick: () => {
                                    const collectionResult = uiManager.collectVendorItem(item, vendorData.id);

                                    uiManager.showDialog({
                                        text: collectionResult.message,
                                        buttons: [{
                                            label: 'Continue',
                                            onClick: () => showItemsDialog(page)
                                        }]
                                    });
                                }
                            }));

                            const bottomButtons = [];
                            const exitButton = {
                                label: 'Back',
                                onClick: () => uiManager.showDialog(originalDialogData)
                            };

                            // Add pagination buttons - always show both, disable when not applicable
                            if (totalPages > 1) {
                                bottomButtons.push({
                                    label: '<',
                                    disabled: page <= 0,
                                    onClick: page > 0 ? () => showItemsDialog(page - 1) : () => {}
                                });
                                bottomButtons.push({
                                    label: '>',
                                    disabled: page >= totalPages - 1,
                                    onClick: page < totalPages - 1 ? () => showItemsDialog(page + 1) : () => {}
                                });
                            } else {
                                // Single page - show disabled buttons
                                bottomButtons.push({ label: '<', disabled: true, onClick: () => {} });
                                bottomButtons.push({ label: '>', disabled: true, onClick: () => {} });
                            }

                            uiManager.showDialog({
                                imageKey: imageKey,
                                title: vendorData.name,
                                text: `Available items from ${DomainManager.getDomainName(vendorData.domain_id)} (Page ${page + 1}/${totalPages}):`,
                                buttons: itemButtons,
                                bottomButtons: bottomButtons,
                                exitButton: exitButton
                            });
                        };

                        showItemsDialog(0); // Start with first page
                        return;
                    } else {
                        newText = 'No items available at this time.';
                    }
                } else if (response.action === 'booth_info') {
                    uiManager.showDialog({
                        imageKey: imageKey,
                        title: vendorData.name,
                        text: `Booth: ${vendorData.booth}\nDescription: ${vendorData.description}\nDomain: ${DomainManager.getDomainName(vendorData.domain_id)}`,
                        buttons: [{
                            label: 'Back',
                            onClick: () => uiManager.showDialog(originalDialogData)
                        }]
                    });
                    return;
                } else if (response.action === 'tech_facts') {
                    const allDomainFacts = DomainManager.getDomainFacts(vendorData.domain_id);
                    if (allDomainFacts.length > 0) {
                        // Limit to maximum 6 randomly selected facts per vendor
                        const maxFactsPerVendor = 6;
                        const selectedFacts = allDomainFacts.length <= maxFactsPerVendor
                            ? allDomainFacts
                            : this.getRandomFacts(allDomainFacts, maxFactsPerVendor);

                        // Format facts with bullet points for display (no extra newlines - pagination handles spacing)
                        const formattedFacts = selectedFacts.map(fact => `• ${fact}`);

                        // Show facts using intelligent text pagination based on line limits
                        uiManager.showDialog({
                            imageKey: imageKey,
                            title: vendorData.name,
                            text: formattedFacts,
                            textPagination: {
                                currentPage: 0,
                                text: formattedFacts
                            },
                            buttons: [],
                            exitButton: {
                                label: 'Back',
                                onClick: () => uiManager.showDialog(originalDialogData)
                            }
                        });
                        return;
                    } else {
                        newText = 'No facts available at this time.';
                    }
                }
                uiManager.showDialog({
                    text: newText,
                    buttons: [{
                        label: 'Back',
                        onClick: () => uiManager.showDialog(originalDialogData)
                    }]
                });
            }
        }));

        const exitButton = vendorData.dialog.responses.find(response => response.action === 'end') ? {
            label: vendorData.dialog.responses.find(response => response.action === 'end').text,
            onClick: () => uiManager.closeDialog()
        } : null;  // Fallback if no 'end' action

        // Full dialog logic adapted from NPCManager (using DomainManager for items/facts)
        const originalDialogData = {
            imageKey: imageKey,
            title: vendorData.name,
            text: vendorData.description,  // Changed from 'description' to 'text' to match dialog system expectations
            buttons: responseButtons,  // Main button stack (response buttons)
            exitButton: exitButton  // Separate exit button for bottom positioning
        };
        uiManager.showDialog(originalDialogData);
        return true;
    }

    getRandomFacts(factsArray, count) {
        // Create a copy of the array to avoid modifying the original
        const facts = [...factsArray];

        // Shuffle the array using Fisher-Yates algorithm
        for (let i = facts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [facts[i], facts[j]] = [facts[j], facts[i]];
        }

        // Return the first 'count' facts
        return facts.slice(0, count);
    }

    update() {
        this.assignVendorsToNPCs();

        if (!this.scene.player || !this.scene.npcGroup) return;

        if (!DomainManager.isLoaded()) {
            this.nearbyVendor = null;
            this.interactionPrompt.setVisible(false);
            return;
        }

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

        if (this.nearbyVendor && this.isInteractionAvailable()) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }
}

export default VendorManager;