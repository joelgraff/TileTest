import DomainManager from './domainManager.js';
import CrisisManager from './CrisisManager.js';

class VendorDialog {
    constructor(scene) {
        this.scene = scene;
        this.vendorInventories = new Map(); // Cache for static vendor inventories
        this.crisisManager = new CrisisManager();
    }

    interactWithVendor(vendorData, npcSprite = null) {
        console.log('Attempting to interact with vendor:', vendorData);
        if (!vendorData) return;

        // Use the NPC sprite's texture key if available, else fallback
        const imageKey = npcSprite ? npcSprite.texture.key : (vendorData.imageKey || 'npc1');

        // Check if NPC has an active crisis
        const hasCrisis = npcSprite && this.crisisManager.hasActiveCrisis(npcSprite);

        if (hasCrisis) {
            // Show crisis dialog instead of normal vendor dialog
            this.showCrisisDialog(vendorData, npcSprite, imageKey);
            return;
        }

        // Normal vendor interaction continues...
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
                    onClick: () => this.showNormalVendorDialog(vendorData, null, imageKey)
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
                    // Only process collection quests that have items
                    if (quest.type === 'collection') {
                        quest.objectives.forEach(objective => {
                            if (!objective.collected && objective.vendorId === vendorData.id && objective.item) {
                                console.log(`Adding quest item ${objective.item.name} to vendor ${vendorData.name}`);
                                questRequiredItems.push(objective.item);
                            }
                        });
                    }
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
                            bottomButtons: [{
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
                                    bottomButtons: [{
                                        label: 'Continue',
                                        onClick: () => showItemsDialog(newPage)
                                    }]
                                });
                            } else {
                                this.scene.uiManager.showDialog({
                                    text: `Collected ${item.name}!\n\n(Item added to your collection)`,
                                    bottomButtons: [{
                                        label: 'Continue',
                                        onClick: () => showItemsDialog(newPage)
                                    }]
                                });
                            }
                        } else {
                            this.scene.uiManager.showDialog({
                                text: `Collected ${item.name}!`,
                                bottomButtons: [{
                                    label: 'Continue',
                                    onClick: () => showItemsDialog(newPage)
                                }]
                            });
                        }
                    } else {
                        this.scene.uiManager.showDialog({
                            text: 'Failed to add item to inventory.',
                            bottomButtons: [{
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
                onClick: () => this.showNormalVendorDialog(vendorData, null, imageKey),
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
                onClick: () => this.showNormalVendorDialog(vendorData, null, imageKey)
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
                    onClick: () => this.showNormalVendorDialog(vendorData, null, imageKey)
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

        const factButtons = pageFacts.map((fact, index) => ({
            label: 'Learn',
            onClick: () => {
                // Check if fact is already collected
                if (this.scene.uiManager.inventoryManager.hasFact(fact)) {
                    this.scene.uiManager.showDialog({
                        text: 'You already know this fact!',
                        buttons: [{
                            label: 'Back',
                            onClick: () => this.displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage)
                        }]
                    });
                    return;
                }

                // Add fact to player's knowledge
                const factAdded = this.scene.uiManager.inventoryManager.addFact(fact);

                if (factAdded) {
                    this.scene.uiManager.showDialog({
                        text: `Learned: ${fact.substring(0, 100)}${fact.length > 100 ? '...' : ''}`,
                        buttons: [{
                            label: 'Continue',
                            onClick: () => this.displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage)
                        }]
                    });
                } else {
                    this.scene.uiManager.showDialog({
                        text: 'Failed to learn fact.',
                        buttons: [{
                            label: 'Back',
                            onClick: () => this.displayTechFactsDialog(facts, vendorData, imageKey, originalDialogData, currentPage)
                        }]
                    });
                }
            }
        }));

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
            onClick: () => this.showNormalVendorDialog(vendorData, null, imageKey),
            options: { height: 30 }
        });

        const dialogData = {
            imageKey: imageKey,
            title: `${vendorData.name} - Tech Facts`,
            text: displayText,
            buttons: factButtons,
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

    showCrisisDialog(vendorData, npcSprite, imageKey) {
        const crisis = vendorData.crisis;
        if (!crisis) {
            console.error('No crisis data found for vendor:', vendorData.name);
            // Show normal dialog instead
            this.showNormalVendorDialog(vendorData, npcSprite, imageKey);
            return;
        }

        const crisisDescription = this.scene.crisisManager.getCrisisDescription(crisis);
        const solution = crisis.solutions[0]; // Each crisis now has only one solution

        // Add debugging information
        let debugInfo = '';
        if (solution.type === 'item') {
            // Find vendors who have this item in their domain
            const vendorsWithItem = [];
            if (this.scene.npcGroup) {
                this.scene.npcGroup.getChildren().forEach(npc => {
                    if (npc.vendorData && npc.vendorData.id !== vendorData.id) {
                        const domainItems = DomainManager.getDomainItems(npc.vendorData.domain_id);
                        if (domainItems.some(item => item.name === solution.itemName)) {
                            vendorsWithItem.push(npc.vendorData.name);
                        }
                    }
                });
            }
            debugInfo = `DEBUG: Needs item "${solution.itemName}"\nAvailable from: ${vendorsWithItem.join(', ') || 'None'}`;
        } else {
            // Find vendors whose domain contains the required knowledge
            const vendorsWithKnowledge = [];
            if (this.scene.npcGroup) {
                this.scene.npcGroup.getChildren().forEach(npc => {
                    if (npc.vendorData && npc.vendorData.id !== vendorData.id) {
                        const domainFacts = DomainManager.getDomainFacts(npc.vendorData.domain_id);
                        if (domainFacts.some(fact => fact.toLowerCase().includes(solution.factKeyword))) {
                            vendorsWithKnowledge.push(npc.vendorData.name);
                        }
                    }
                });
            }
            debugInfo = `DEBUG: Needs knowledge about "${solution.factKeyword}"\nAvailable from: ${vendorsWithKnowledge.join(', ') || 'None'}`;
        }

        const dialogText = `${vendorData.name} is having a crisis!\n\n${crisisDescription.description}\n\n${debugInfo}\n\nCan you help resolve this issue?`;

        const buttons = [
            {
                label: solution.type === 'item' ? 'Use Item' : 'Share Knowledge',
                onClick: () => {
                    if (solution.type === 'item') {
                        this.showCrisisResolutionDialog(vendorData, npcSprite, imageKey, 'item');
                    } else {
                        this.showKnowledgeSharingDialog(vendorData, npcSprite, imageKey);
                    }
                }
            },
            {
                label: 'Not Now',
                onClick: () => this.showNormalVendorDialog(vendorData, npcSprite, imageKey)
            }
        ];

        this.scene.uiManager.showDialog({
            imageKey: imageKey,
            title: `${vendorData.name} - Crisis!`,
            text: dialogText,
            buttons: buttons,
            buttonAlignment: 'textLeft'
        });
    }

    showCrisisResolutionDialog(vendorData, npcSprite, imageKey, resolutionType) {
        const crisis = vendorData.crisis;
        const playerInventory = this.scene.uiManager.inventoryManager.getInventory();

        let availableItems = [];
        if (resolutionType === 'item') {
            // Filter items that can resolve this crisis
            availableItems = playerInventory.filter(item =>
                this.scene.crisisManager.canItemResolveCrisis(item, crisis)
            );
        }

        if (availableItems.length === 0) {
            // Get hint about what item is needed
            const neededItem = crisis.solutions[0].itemName;

            this.scene.uiManager.showDialog({
                text: `You don't have the ${neededItem} I need.\n\nTalk to other vendors and buy a ${neededItem} to help me.`,
                buttons: [{
                    label: 'Back',
                    onClick: () => this.showCrisisDialog(vendorData, npcSprite, imageKey)
                }]
            });
            return;
        }

        const dialogText = `Select an item to use for resolving ${vendorData.name}'s crisis:`;

        const itemButtons = availableItems.map(item => ({
            label: item.name,
            onClick: () => this.attemptCrisisResolution(vendorData, npcSprite, item, imageKey, 'item')
        }));

        this.scene.uiManager.showDialog({
            imageKey: imageKey,
            title: 'Resolve Crisis',
            text: dialogText,
            buttons: itemButtons,
            bottomButtons: [{
                label: 'Back',
                onClick: () => this.showCrisisDialog(vendorData, npcSprite, imageKey)
            }],
            buttonAlignment: 'textLeft'
        });
    }

    showKnowledgeSharingDialog(vendorData, npcSprite, imageKey) {
        const crisis = vendorData.crisis;
        const playerFacts = this.scene.uiManager.inventoryManager.getCollectedFacts();

        // Filter facts that can resolve this crisis
        const availableFacts = playerFacts.filter(fact =>
            this.scene.crisisManager.canFactResolveCrisis(fact, crisis)
        );

        if (availableFacts.length === 0) {
            // Get hint about what knowledge is needed
            const neededKnowledge = crisis.solutions[0].factKeyword;

            this.scene.uiManager.showDialog({
                text: `You don't have knowledge about ${neededKnowledge} that I need.\n\nTalk to vendors and ask about "tech facts" to learn what I need.`,
                buttons: [{
                    label: 'Back',
                    onClick: () => this.showCrisisDialog(vendorData, npcSprite, imageKey)
                }]
            });
            return;
        }

        const dialogText = `Select knowledge to share for resolving ${vendorData.name}'s crisis:`;

        const factButtons = availableFacts.map(fact => ({
            label: fact.substring(0, 50) + (fact.length > 50 ? '...' : ''),
            onClick: () => this.attemptCrisisResolution(vendorData, npcSprite, fact, imageKey, 'knowledge')
        }));

        this.scene.uiManager.showDialog({
            imageKey: imageKey,
            title: 'Share Knowledge',
            text: dialogText,
            buttons: factButtons,
            bottomButtons: [{
                label: 'Back',
                onClick: () => this.showCrisisDialog(vendorData, npcSprite, imageKey)
            }],
            buttonAlignment: 'textLeft'
        });
    }

    attemptCrisisResolution(vendorData, npcSprite, resolutionItem, imageKey, resolutionType = 'item') {
        const crisis = vendorData.crisis;
        const success = this.scene.crisisManager.attemptCrisisResolution(crisis, resolutionItem, resolutionType);

        if (success) {
            // Remove the used item/fact from player's inventory
            if (resolutionType === 'item') {
                this.scene.uiManager.inventoryManager.removeItem(resolutionItem.name);
            } else {
                this.scene.uiManager.inventoryManager.removeFact(resolutionItem);
            }

            // Clear the crisis from the NPC using CrisisManager
            this.scene.crisisManager.clearCrisis(npcSprite);

            // Update visual indicator (remove red glow)
            if (npcSprite) {
                npcSprite.clearTint();
                npcSprite.setTint(0x00ffff); // Cyan glow for normal state
            }

            // Check for quest completion
            if (this.scene.questManager) {
                const questCompleted = this.scene.questManager.checkCrisisResolution(vendorData.id);
                if (questCompleted) {
                    this.scene.uiManager.showDialog({
                        text: `Crisis resolved! ${vendorData.name} is back to normal.\n\nQuest completed! You earned ${questCompleted.points} points.`,
                        bottomButtons: [{
                            label: 'Continue',
                            onClick: () => this.showNormalVendorDialog(vendorData, npcSprite, imageKey)
                        }]
                    });
                } else {
                    this.scene.uiManager.showDialog({
                        text: `Crisis resolved! ${vendorData.name} is back to normal.\n\nThank you for your help!`,
                        bottomButtons: [{
                            label: 'Continue',
                            onClick: () => this.showNormalVendorDialog(vendorData, npcSprite, imageKey)
                        }]
                    });
                }
            } else {
                this.scene.uiManager.showDialog({
                    text: `Crisis resolved! ${vendorData.name} is back to normal.\n\nThank you for your help!`,
                    bottomButtons: [{
                        label: 'Continue',
                        onClick: () => this.showNormalVendorDialog(vendorData, npcSprite, imageKey)
                    }]
                });
            }
        } else {
            this.scene.uiManager.showDialog({
                text: 'That didn\'t work. The crisis persists.',
                buttons: [{
                    label: 'Try Again',
                    onClick: () => this.showCrisisDialog(vendorData, npcSprite, imageKey)
                }]
            });
        }
    }

    showNormalVendorDialog(vendorData, npcSprite, imageKey) {
        // Normal vendor interaction continues...
        const responseButtons = vendorData.dialog.responses
            .filter(response => response.action !== 'end' && response.text !== 'Tell me about your booth')
            .map(response => ({
                label: response.text,
                onClick: () => {
                    let newText = '';
                    if (response.action === 'show_items') {
                        this.showItemsDialog(vendorData, imageKey, null);
                        return;
                    } else if (response.action === 'booth_info') {
                        this.showBoothInfoDialog(vendorData, imageKey, null);
                        return;
                    } else if (response.action === 'tech_facts') {
                        this.showTechFactsDialog(vendorData, imageKey, null);
                        return;
                    }
                    this.scene.uiManager.showDialog({
                        text: newText,
                        buttons: [{
                            label: 'Back',
                            onClick: () => this.showNormalVendorDialog(vendorData, npcSprite, imageKey)
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
}

export default VendorDialog;