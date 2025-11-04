/**
 * InventoryManager - Handles inventory system logic and UI
 */
class InventoryManager {
    constructor(scene, uiManager) {
        this.scene = scene;
        this.uiManager = uiManager;
        this.inventory = [];
        this.facts = []; // Add facts collection
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
        this.currentPage = 0;
        this.itemsPerPage = 3;
    }

    /**
     * Add an item to inventory
     * @param {Object} item - Item to add
     * @returns {boolean} Success status
     */
    addItem(item) {
        if (this.inventory.length < this.maxInventorySlots) {
            this.inventory.push(item);
            this.uiManager.updateScore(item.value || 0);
            return true;
        }
        return false;
    }

    /**
     * Remove an item from inventory
     * @param {number} index - Index of item to remove
     */
    removeItem(index) {
        if (index >= 0 && index < this.inventory.length) {
            this.inventory.splice(index, 1);
        }
    }

    /**
     * Get current inventory
     * @returns {Array} Inventory items
     */
    getInventory() {
        return [...this.inventory];
    }

    /**
     * Check if inventory has space
     * @returns {boolean} Has space
     */
    hasSpace() {
        return this.inventory.length < this.maxInventorySlots;
    }

    /**
     * Add a fact to collected knowledge
     * @param {string} fact - Fact to add
     * @returns {boolean} Success status
     */
    addFact(fact) {
        if (!this.facts.includes(fact)) {
            this.facts.push(fact);
            console.log(`Collected fact: ${fact}`);
            return true;
        }
        return false; // Already have this fact
    }

    /**
     * Remove a fact from collected knowledge
     * @param {string} fact - Fact to remove
     */
    removeFact(fact) {
        const index = this.facts.indexOf(fact);
        if (index >= 0) {
            this.facts.splice(index, 1);
        }
    }

    /**
     * Get collected facts
     * @returns {Array} Collected facts
     */
    getCollectedFacts() {
        return [...this.facts];
    }

    /**
     * Check if a fact has been collected
     * @param {string} fact - Fact to check
     * @returns {boolean} Has fact
     */
    hasFact(fact) {
        return this.facts.includes(fact);
    }

    /**
     * Toggle inventory dialog
     */
    toggleInventory() {
        if (this.isInventoryOpen) {
            this.uiManager.closeDialog();
            this.isInventoryOpen = false;
            return;
        }

        this.isInventoryOpen = true;

        // Reset to first page when opening inventory
        this.currentPage = 0;

        // Calculate pagination
        const ITEMS_PER_PAGE = 3;
        const totalPages = Math.ceil(this.inventory.length / ITEMS_PER_PAGE);
        const startIndex = this.currentPage * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, this.inventory.length);
        const currentPageItems = this.inventory.slice(startIndex, endIndex);

        // Ensure we don't show more than ITEMS_PER_PAGE items
        const displayItems = currentPageItems.slice(0, ITEMS_PER_PAGE);

        // Create inventory dialog content
        let inventoryText = 'INVENTORY\n\n';
        if (this.inventory.length === 0) {
            inventoryText += 'No items collected yet.';
        } else {
            // Show page info
            if (totalPages > 1) {
                inventoryText += `Page ${this.currentPage + 1} of ${totalPages}\n\n`;
            }

            // Show items for current page
            displayItems.forEach((item, pageIndex) => {
                const globalIndex = startIndex + pageIndex;
                inventoryText += `${globalIndex + 1}. ${item.name}\n`;
                if (item.description) {
                    inventoryText += `   ${item.description}\n`;
                }
                inventoryText += `   Value: ${item.value || 0} points\n\n`;
            });
        }

        // Create drop buttons for current page items
        const buttons = [];
        if (displayItems.length > 0) {
            displayItems.forEach((item, pageIndex) => {
                const globalIndex = startIndex + pageIndex;
                buttons.push({
                    label: 'Drop',
                    onClick: () => {
                        this.removeItem(globalIndex);
                        // Adjust current page if we removed the last item on this page
                        const newTotalPages = Math.ceil((this.inventory.length - 1) / this.itemsPerPage);
                        if (this.currentPage >= newTotalPages && newTotalPages > 0) {
                            this.currentPage = newTotalPages - 1;
                        }
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                });
            });
        }

        // Create pagination buttons (matching help dialog layout)
        const leftButtons = [];
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: this.currentPage <= 0,
                onClick: () => {
                    if (this.currentPage > 0) {
                        this.currentPage--;
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                },
                options: { width: 68 }
            });

            leftButtons.push({
                label: '>',
                disabled: this.currentPage >= totalPages - 1,
                onClick: () => {
                    if (this.currentPage < totalPages - 1) {
                        this.currentPage++;
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                },
                options: { width: 68 }
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Inventory',
            text: inventoryText,
            buttons: buttons,
            buttonPosition: 'right',
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isInventoryOpen = false;
                    this.uiManager.closeDialog();
                }
            },
            exitButtonPosition: 'right' // Close button at bottom right
        };

        this.uiManager.showDialog(dialogData);
    }
    refreshInventoryDialog() {
        // Calculate pagination
        const ITEMS_PER_PAGE = 3;
        const totalPages = Math.ceil(this.inventory.length / ITEMS_PER_PAGE);
        const startIndex = this.currentPage * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, this.inventory.length);
        const currentPageItems = this.inventory.slice(startIndex, endIndex);

        // Ensure we don't show more than ITEMS_PER_PAGE items
        const displayItems = currentPageItems.slice(0, ITEMS_PER_PAGE);

        // Create inventory dialog content
        let inventoryText = 'INVENTORY\n\n';
        if (this.inventory.length === 0) {
            inventoryText += 'No items collected yet.';
        } else {
            // Show page info
            if (totalPages > 1) {
                inventoryText += `Page ${this.currentPage + 1} of ${totalPages}\n\n`;
            }

            // Show items for current page
            displayItems.forEach((item, pageIndex) => {
                const globalIndex = startIndex + pageIndex;
                inventoryText += `${globalIndex + 1}. ${item.name}\n`;
                if (item.description) {
                    inventoryText += `   ${item.description}\n`;
                }
                inventoryText += `   Value: ${item.value || 0} points\n\n`;
            });
        }

        // Create drop buttons for current page items
        const buttons = [];
        if (displayItems.length > 0) {
            displayItems.forEach((item, pageIndex) => {
                const globalIndex = startIndex + pageIndex;
                buttons.push({
                    label: 'Drop',
                    onClick: () => {
                        this.removeItem(globalIndex);
                        // Adjust current page if we removed the last item on this page
                        const newTotalPages = Math.ceil((this.inventory.length - 1) / this.itemsPerPage);
                        if (this.currentPage >= newTotalPages && newTotalPages > 0) {
                            this.currentPage = newTotalPages - 1;
                        }
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                });
            });
        }

        // Create pagination buttons (matching help dialog layout)
        const leftButtons = [];
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: this.currentPage <= 0,
                onClick: () => {
                    if (this.currentPage > 0) {
                        this.currentPage--;
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                },
                options: { width: 68 }
            });

            leftButtons.push({
                label: '>',
                disabled: this.currentPage >= totalPages - 1,
                onClick: () => {
                    if (this.currentPage < totalPages - 1) {
                        this.currentPage++;
                        this.refreshInventoryDialog(); // Refresh dialog
                    }
                },
                options: { width: 68 }
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Inventory',
            text: inventoryText,
            buttons: buttons,
            buttonPosition: 'right',
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isInventoryOpen = false;
                    this.uiManager.closeDialog();
                }
            },
            exitButtonPosition: 'right' // Close button at bottom right
        };

        this.uiManager.showDialog(dialogData);
    }

    /**
     * Handle input for inventory
     * @param {string} key - Key pressed
     * @returns {boolean} Handled input
     */
    handleInput(key) {
        if (key === 'I' || key === 'i') {
            this.toggleInventory();
            return true;
        }
        return false;
    }
}

export default InventoryManager;