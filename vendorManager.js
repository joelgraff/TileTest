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

        const npcs = this.scene.npcGroup.getChildren();
        const numNpcs = npcs.length;

        // Group vendors by domain
        const vendorsByDomain = {};
        this.vendors.forEach(vendor => {
            if (!vendorsByDomain[vendor.domain_id]) {
                vendorsByDomain[vendor.domain_id] = [];
            }
            vendorsByDomain[vendor.domain_id].push(vendor);
        });

        console.log('Vendors by domain:', Object.keys(vendorsByDomain).map(domain => `${domain}: ${vendorsByDomain[domain].length} vendors`));

        // Select vendors to ensure domain diversity
        const selectedVendors = [];
        const domains = Object.keys(vendorsByDomain);

        // First, select one vendor from each domain
        domains.forEach(domain => {
            if (vendorsByDomain[domain].length > 0 && selectedVendors.length < numNpcs) {
                const randomVendor = vendorsByDomain[domain][Math.floor(Math.random() * vendorsByDomain[domain].length)];
                selectedVendors.push(randomVendor);
                // Remove this vendor from the pool to avoid duplicates
                vendorsByDomain[domain] = vendorsByDomain[domain].filter(v => v.id !== randomVendor.id);
            }
        });

        // If we still need more vendors, fill with random remaining vendors
        const remainingVendors = [];
        domains.forEach(domain => {
            remainingVendors.push(...vendorsByDomain[domain]);
        });

        while (selectedVendors.length < numNpcs && remainingVendors.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingVendors.length);
            selectedVendors.push(remainingVendors[randomIndex]);
            remainingVendors.splice(randomIndex, 1);
        }

        console.log('Selected vendors for NPCs:', selectedVendors.map(v => `${v.name} (${v.domain_id})`));

        // Assign selected vendors to NPCs
        npcs.forEach((npcSprite, index) => {
            if (index < selectedVendors.length) {
                npcSprite.vendorData = selectedVendors[index];
            } else {
                // Fallback to random if we somehow don't have enough
                npcSprite.vendorData = this.vendors[Math.floor(Math.random() * this.vendors.length)];
            }

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
                    // Clear any existing input state to prevent player movement
                    if (this.scene.inputManager) {
                        this.scene.inputManager.target = null;
                        this.scene.inputManager.isDragging = false;
                        this.scene.inputManager.direction = { x: 0, y: 0 };
                    }
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
        const responseButtons = vendorData.dialog.responses
            .filter(response => response.action !== 'end' && response.text !== 'Tell me about your booth')
            .map(response => ({
            label: response.text,
            onClick: () => {
                let newText = '';
                if (response.action === 'show_items') {
                    const allDomainItems = DomainManager.getDomainItems(vendorData.domain_id);
                    if (allDomainItems.length > 0) {
                        // Get quest-required items for this domain
                        let questRequiredItems = [];
                        if (this.scene.questManager) {
                            const activeQuests = this.scene.questManager.getActiveQuests();
                            activeQuests.forEach(quest => {
                                if (quest.domains.includes(vendorData.domain_id)) {
                                    quest.objectives.forEach(objective => {
                                        if (!objective.collected) {
                                            questRequiredItems.push(objective.item);
                                        }
                                    });
                                }
                            });
                        }

                        // Distribute quest items across vendors in the same domain
                        let distributedQuestItems = [];
                        if (questRequiredItems.length > 0) {
                            // Find all vendors in this domain
                            const vendorsInDomain = [];
                            this.scene.npcGroup.getChildren().forEach(npc => {
                                if (npc.vendorData && npc.vendorData.domain_id === vendorData.domain_id) {
                                    vendorsInDomain.push(npc.vendorData);
                                }
                            });

                            // Sort vendors by ID for consistent distribution
                            vendorsInDomain.sort((a, b) => a.id.localeCompare(b.id));
                            const vendorIndex = vendorsInDomain.findIndex(v => v.id === vendorData.id);

                            if (vendorIndex !== -1) {
                                // Distribute quest items round-robin across vendors
                                questRequiredItems.forEach((item, itemIndex) => {
                                    const assignedVendorIndex = itemIndex % vendorsInDomain.length;
                                    if (assignedVendorIndex === vendorIndex) {
                                        distributedQuestItems.push(item);
                                    }
                                });

                                // Ensure at least one quest item per vendor if there are more vendors than items
                                if (distributedQuestItems.length === 0 && vendorIndex < questRequiredItems.length) {
                                    distributedQuestItems.push(questRequiredItems[vendorIndex]);
                                }
                            }
                        }

                        // Ensure quest items are included, then add random items up to the limit
                        let selectedItems = [...distributedQuestItems];
                        const remainingItems = allDomainItems.filter(item =>
                            !selectedItems.some(selected => selected.name === item.name)
                        );

                        // Limit to 6-9 random items per vendor (increased minimum for better quest completion)
                        const minItems = 6;
                        const maxItems = 9;
                        const numItemsToShow = Math.min(
                            Math.max(minItems, Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems),
                            allDomainItems.length
                        );

                        // Add random items to fill the quota
                        const additionalItems = this.getRandomItems(remainingItems, numItemsToShow - selectedItems.length);
                        selectedItems = selectedItems.concat(additionalItems);

                        const domainItems = selectedItems;

                        const itemsPerPage = 5; // Show 5 items per page
                        const totalPages = Math.ceil(domainItems.length / itemsPerPage);

                        const showItemsDialog = (page = 0) => {
                            const startIndex = page * itemsPerPage;
                            const endIndex = Math.min(startIndex + itemsPerPage, domainItems.length);
                            const pageItems = domainItems.slice(startIndex, endIndex);

                            const itemButtons = pageItems.map((item, index) => ({
                                label: item.name,
                                onClick: () => {
                                    if (this.scene.questManager) {
                                        const questUpdated = this.scene.questManager.checkItemCollection(item.name, vendorData.id);
                                        if (questUpdated) {
                                            this.scene.uiManager.showDialog({
                                                text: `Collected ${item.name}!\n\nQuest progress updated!`,
                                                buttons: [{
                                                    label: 'Continue',
                                                    onClick: () => showItemsDialog(page)
                                                }]
                                            });
                                        } else {
                                            this.scene.uiManager.showDialog({
                                                text: `Collected ${item.name}!\n\n(Item added to your collection)`,
                                                buttons: [{
                                                    label: 'Continue',
                                                    onClick: () => showItemsDialog(page)
                                                }]
                                            });
                                        }
                                    } else {
                                        this.scene.uiManager.showDialog({
                                            text: `Collected ${item.name}!`,
                                            buttons: [{
                                                label: 'Continue',
                                                onClick: () => showItemsDialog(page)
                                            }]
                                        });
                                    }
                                }
                            }));

                            const bottomButtons = [];
                            const exitButton = {
                                label: 'Back',
                                onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                            };

                            // Add pagination buttons only when there are multiple pages
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
                            }

                            this.scene.uiManager.showDialog({
                                imageKey: imageKey,
                                title: vendorData.name,
                                text: `Available items from ${DomainManager.getDomainName(vendorData.domain_id)}${totalPages > 1 ? ` (Page ${page + 1}/${totalPages})` : ''}:`,
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
                    this.scene.uiManager.showDialog({
                        imageKey: imageKey,
                        title: vendorData.name,
                        text: `Booth: ${vendorData.booth}\nDescription: ${vendorData.description}`,
                        buttons: [{
                            label: 'Back',
                            onClick: () => this.scene.uiManager.showDialog(originalDialogData)
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

                        // Show facts with pagination
                        this.showTechFactsDialog(selectedFacts, vendorData, imageKey, originalDialogData);
                        return;
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
            title: `${vendorData.name} (${DomainManager.getDomainName(vendorData.domain_id)})`,
            text: vendorData.description,  // Changed from 'description' to 'text' to match dialog system expectations
            buttons: responseButtons,  // Main button stack (response buttons)
            exitButton: exitButton  // Separate exit button for bottom positioning
        };
        this.scene.uiManager.showDialog(originalDialogData);
    }

    showTechFactsDialog(facts, vendorData, imageKey, originalDialogData, page = 0) {
        // Show 4 facts per page maximum to ensure they fit
        const factsPerPage = 4;
        const totalPages = Math.ceil(facts.length / factsPerPage);
        const currentPage = Math.min(page, totalPages - 1);
        const startIndex = currentPage * factsPerPage;
        const endIndex = Math.min(startIndex + factsPerPage, facts.length);
        const pageFacts = facts.slice(startIndex, endIndex);

        // Format facts with bullet points
        const formattedFacts = pageFacts.map(fact => `• ${fact}`);
        const displayText = formattedFacts.join('\n');

        // Create assets
        const assets = {};
        const layoutOptions = {};

        // Title
        assets.title = [this.scene.add.text(0, 0, `${vendorData.name} - Tech Facts`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        })];

        // NPC Image
        const imageAsset = this.scene.add.image(0, 0, imageKey)
            .setDisplaySize(90, 134)
            .setOrigin(0.5, 0.5);
        assets.mainLeft = [imageAsset];

        // Main text
        const textAsset = this.scene.add.text(0, 0, displayText, {
            fontSize: '16px',
            fontStyle: 'bold',
            wordWrap: { width: 280 },
            color: '#000',
            align: 'left'
        });
        assets.mainRight = [textAsset];

        // Create bottom buttons
        const bottomButtons = [];

        // Back button on the left
        const backButton = this.scene.add.text(0, 0, '< Back', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => this.scene.uiManager.showDialog(originalDialogData));
        bottomButtons.push(backButton);

        // Pagination buttons on the right (if needed)
        if (totalPages > 1) {
            const prevButton = this.scene.add.text(0, 0, '<', {
                fontSize: '16px',
                color: currentPage <= 0 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage > 0) {
                prevButton.setInteractive().on('pointerdown', () => this.showTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage - 1));
            }
            bottomButtons.push(prevButton);

            const nextButton = this.scene.add.text(0, 0, '>', {
                fontSize: '16px',
                color: currentPage >= totalPages - 1 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage < totalPages - 1) {
                nextButton.setInteractive().on('pointerdown', () => this.showTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage + 1));
            }
            bottomButtons.push(nextButton);
        }

        assets.bottom = bottomButtons;
        // Use custom layout that positions back button left, pagination buttons right
        layoutOptions.bottom = { horizontal: true, spacing: 20, leftAlignFirst: true };

        this.scene.uiManager.dialogManager.showDialog(assets, layoutOptions);
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

    getRandomItems(itemsArray, count) {
        // Create a copy of the array to avoid modifying the original
        const items = [...itemsArray];

        // Shuffle the array using Fisher-Yates algorithm
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        // Return the first 'count' items
        return items.slice(0, count);
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