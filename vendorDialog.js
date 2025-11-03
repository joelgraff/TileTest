import DomainManager from './domainManager.js';

class VendorDialog {
    constructor(scene) {
        this.scene = scene;
        this.vendorInventories = new Map(); // Cache for static vendor inventories
    }

    interactWithVendor(vendorData, npcSprite = null) {
        console.log('Attempting to interact with vendor:', vendorData);
        if (!vendorData) return;

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
                        this.showItemsDialog(vendorData, imageKey, originalDialogData);
                        return;
                    } else if (response.action === 'booth_info') {
                        this.showBoothInfoDialog(vendorData, imageKey, originalDialogData);
                        return;
                    } else if (response.action === 'tech_facts') {
                        this.showTechFactsDialog(vendorData, imageKey, originalDialogData);
                        return;
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
        } : null;

        const originalDialogData = {
            imageKey: imageKey,
            title: `${vendorData.name} (${DomainManager.getDomainName(vendorData.domain_id)})`,
            text: vendorData.description,
            buttons: responseButtons,
            exitButton: exitButton,
            buttonAlignment: 'textLeft'
        };
        this.scene.uiManager.showDialog(originalDialogData);
    }

    showItemsDialog(vendorData, imageKey, originalDialogData) {
        const allDomainItems = DomainManager.getDomainItems(vendorData.domain_id);
        if (allDomainItems.length === 0) {
            this.scene.uiManager.showDialog({
                text: 'No items available at this time.',
                buttons: [{
                    label: 'Back',
                    onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                }]
            });
            return;
        }

        // Check if we have a cached inventory for this vendor
        const cacheKey = vendorData.id;
        let domainItems;

        if (this.vendorInventories.has(cacheKey)) {
            // Use cached inventory
            domainItems = this.vendorInventories.get(cacheKey);
        } else {
            // Generate and cache new inventory
            console.log(`Generating inventory for vendor ${vendorData.name} (${vendorData.domain_id})`);

            // Quest logic for item distribution - now uses pre-assigned vendors from quest generation
            let questRequiredItems = [];
            if (this.scene.questManager) {
                const activeQuests = this.scene.questManager.getActiveQuests();
                activeQuests.forEach(quest => {
                    quest.objectives.forEach(objective => {
                        if (!objective.collected && objective.vendorId === vendorData.id) {
                            console.log(`Adding quest item ${objective.item.name} to vendor ${vendorData.name}`);
                            questRequiredItems.push(objective.item);
                        }
                    });
                });
            }

            let selectedItems = [...questRequiredItems];
            const remainingItems = allDomainItems.filter(item =>
                !selectedItems.some(selected => selected.name === item.name)
            );

            const minItems = 6;
            const maxItems = 9;
            const numItemsToShow = Math.min(
                Math.max(minItems, Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems),
                allDomainItems.length
            );

            const additionalItems = this.getRandomItems(remainingItems, numItemsToShow - selectedItems.length);
            selectedItems = selectedItems.concat(additionalItems);

            domainItems = selectedItems;
            this.vendorInventories.set(cacheKey, domainItems);

            console.log(`Cached ${domainItems.length} items for vendor ${vendorData.name}:`, domainItems.map(i => i.name));
        }
        const itemsPerPage = 5;
        const totalPages = Math.ceil(domainItems.length / itemsPerPage);

        const showItemsDialog = (page = 0) => {
            const startIndex = page * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, domainItems.length);
            const pageItems = domainItems.slice(startIndex, endIndex);

            const pageIndicator = totalPages > 1 ? `Page ${page + 1} of ${totalPages}` : '';
            const dialogText = `${pageIndicator}\n\nAvailable items from ${DomainManager.getDomainName(vendorData.domain_id)}:`;

            const itemButtons = pageItems.map((item, index) => ({
                label: item.name,
                onClick: () => {
                    // Check if player has inventory space
                    if (!this.scene.uiManager || !this.scene.uiManager.inventoryManager || !this.scene.uiManager.inventoryManager.hasSpace()) {
                        this.scene.uiManager.showDialog({
                            text: 'Your inventory is full! Drop some items first.',
                            buttons: [{
                                label: 'Continue',
                                onClick: () => showItemsDialog(page)
                            }]
                        });
                        return;
                    }

                    // Add item to player's inventory
                    const itemAdded = this.scene.uiManager.inventoryManager.addItem(item);

                    if (itemAdded) {
                        // Remove item from vendor's inventory
                        const globalIndex = startIndex + index;
                        domainItems.splice(globalIndex, 1);

                        // Update cached inventory
                        this.vendorInventories.set(cacheKey, domainItems);

                        // Calculate new page after removal
                        const newTotalPages = Math.ceil(domainItems.length / itemsPerPage);
                        let newPage = page;

                        // If current page is now empty and not the first page, go to previous page
                        if (page >= newTotalPages && newTotalPages > 0) {
                            newPage = newTotalPages - 1;
                        }

                        if (this.scene.questManager) {
                            const questUpdated = this.scene.questManager.checkItemCollection(item.name, vendorData.id);
                            if (questUpdated) {
                                this.scene.uiManager.showDialog({
                                    text: `Collected ${item.name}!\n\nQuest progress updated!`,
                                    buttons: [{
                                        label: 'Continue',
                                        onClick: () => showItemsDialog(newPage)
                                    }]
                                });
                            } else {
                                this.scene.uiManager.showDialog({
                                    text: `Collected ${item.name}!\n\n(Item added to your collection)`,
                                    buttons: [{
                                        label: 'Continue',
                                        onClick: () => showItemsDialog(newPage)
                                    }]
                                });
                            }
                        } else {
                            this.scene.uiManager.showDialog({
                                text: `Collected ${item.name}!`,
                                buttons: [{
                                    label: 'Continue',
                                    onClick: () => showItemsDialog(newPage)
                                }]
                            });
                        }
                    } else {
                        this.scene.uiManager.showDialog({
                            text: 'Failed to add item to inventory.',
                            buttons: [{
                                label: 'Continue',
                                onClick: () => showItemsDialog(page)
                            }]
                        });
                    }
                }
            }));

            const bottomButtons = [];
            if (totalPages > 1) {
                bottomButtons.push({
                    label: '<',
                    disabled: page <= 0,
                    onClick: page > 0 ? () => showItemsDialog(page - 1) : () => {},
                    options: { height: 30 }
                });
                bottomButtons.push({
                    label: '>',
                    disabled: page >= totalPages - 1,
                    onClick: page < totalPages - 1 ? () => showItemsDialog(page + 1) : () => {},
                    options: { height: 30 }
                });
            }

            // Add Back button at the end of bottomButtons
            bottomButtons.push({
                label: 'Back',
                onClick: () => this.scene.uiManager.showDialog(originalDialogData),
                options: { height: 30 }
            });

            this.scene.uiManager.showDialog({
                imageKey: imageKey,
                title: vendorData.name,
                text: dialogText,
                buttons: itemButtons,
                bottomButtons: bottomButtons,
                bottomButtonsAlign: 'split',
                dialogType: 'interaction',
                buttonAlignment: 'textLeft'
            });
        };

        showItemsDialog(0);
    }

    showBoothInfoDialog(vendorData, imageKey, originalDialogData) {
        this.scene.uiManager.showDialog({
            imageKey: imageKey,
            title: vendorData.name,
            text: `Booth: ${vendorData.booth}\nDescription: ${vendorData.description}`,
            buttons: [{
                label: 'Back',
                onClick: () => this.scene.uiManager.showDialog(originalDialogData)
            }],
            buttonAlignment: 'textLeft'
        });
    }

    showTechFactsDialog(vendorData, imageKey, originalDialogData) {
        const allDomainFacts = DomainManager.getDomainFacts(vendorData.domain_id);
        if (allDomainFacts.length === 0) {
            this.scene.uiManager.showDialog({
                text: 'No facts available at this time.',
                buttons: [{
                    label: 'Back',
                    onClick: () => this.scene.uiManager.showDialog(originalDialogData)
                }]
            });
            return;
        }

        const maxFactsPerVendor = 6;
        const selectedFacts = allDomainFacts.length <= maxFactsPerVendor
            ? allDomainFacts
            : this.getRandomFacts(allDomainFacts, maxFactsPerVendor);

        this.displayTechFactsDialog(selectedFacts, vendorData, imageKey, originalDialogData);
    }

    displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, page = 0) {
        const factsPerPage = 4;
        const totalPages = Math.ceil(facts.length / factsPerPage);
        const currentPage = Math.min(page, totalPages - 1);
        const startIndex = currentPage * factsPerPage;
        const endIndex = Math.min(startIndex + factsPerPage, facts.length);
        const pageFacts = facts.slice(startIndex, endIndex);

        const formattedFacts = pageFacts.map(fact => `• ${fact}`);
        const displayText = formattedFacts.join('\n');

        const bottomButtons = [];

        // Add pagination buttons first
        if (totalPages > 1) {
            bottomButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: currentPage > 0 ? () => this.displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage - 1) : () => {},
                options: { height: 30 }
            });
            bottomButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: currentPage < totalPages - 1 ? () => this.displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage + 1) : () => {},
                options: { height: 30 }
            });
        }

        // Add Back button at the end
        bottomButtons.push({
            label: 'Back',
            onClick: () => this.scene.uiManager.showDialog(originalDialogData),
            options: { height: 30 }
        });

        const dialogData = {
            imageKey: imageKey,
            title: `${vendorData.name} - Tech Facts`,
            text: displayText,
            bottomButtons: bottomButtons,
            bottomButtonsAlign: 'split',
            buttonAlignment: 'textLeft'
        };

        this.scene.uiManager.showDialog(dialogData);
    }

    getRandomFacts(factsArray, count) {
        const facts = [...factsArray];
        for (let i = facts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [facts[i], facts[j]] = [facts[j], facts[i]];
        }
        return facts.slice(0, count);
    }

    getRandomItems(itemsArray, count) {
        const items = [...itemsArray];
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items.slice(0, count);
    }
}

export default VendorDialog;