/**
 * InventoryManager - Handles inventory system logic and UI
 */
class InventoryManager {
    constructor(scene, uiManager) {
        this.scene = scene;
        this.uiManager = uiManager;
        this.inventory = [];
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
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
     * Toggle inventory dialog
     */
    toggleInventory() {
        if (this.isInventoryOpen) {
            this.uiManager.closeDialog();
            this.isInventoryOpen = false;
            return;
        }

        this.isInventoryOpen = true;

        // Create inventory dialog content
        let inventoryText = 'INVENTORY\n\n';
        if (this.inventory.length === 0) {
            inventoryText += 'No items collected yet.';
        } else {
            this.inventory.forEach((item, index) => {
                inventoryText += `${index + 1}. ${item.name}\n`;
                if (item.description) {
                    inventoryText += `   ${item.description}\n`;
                }
                inventoryText += `   Value: ${item.value || 0} points\n\n`;
            });
        }

        // Create drop buttons
        const buttons = [];
        if (this.inventory.length > 0) {
            this.inventory.forEach((item, index) => {
                buttons.push({
                    label: `Drop ${item.name}`,
                    onClick: () => {
                        this.removeItem(index);
                        this.toggleInventory(); // Refresh dialog
                    }
                });
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Inventory',
            text: inventoryText,
            buttons: buttons,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isInventoryOpen = false;
                    this.uiManager.closeDialog();
                }
            }
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