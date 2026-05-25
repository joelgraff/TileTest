import DialogManager from './dialogManager.js';
import {
    createHelpHudButton,
    createInventoryHudButton,
    createQuestHudButton,
    createScoreHud,
    createUiHud,
    createVersionHud
} from './uiHudFactory.js';
import {
    hideMovementIndicatorReticle,
    initializeMovementIndicator,
    showMovementIndicatorReticle,
    updateMovementIndicatorFromPointer
} from './uiMovementIndicator.js';

class UIManager {
    constructor(scene, { state = null } = {}) {
        this.scene = scene;
        this.inputManager = null;
        this.questManager = null;
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
        this.isQuestsOpen = false; // Track quest panel visibility
        this.isHelpOpen = false; // Track help dialog visibility

        // Sierra-style EGA color palette
        this.colors = {
            background: 0x000080,    // Dark blue
            border: 0x00FFFF,       // Cyan
            text: 0xFFFFFF,         // White
            highlight: 0xFFFF00,    // Yellow
            shadow: 0x000000,       // Black
            button: 0x808080,       // Gray
            buttonHover: 0xC0C0C0   // Light gray
        };

        this.setState(state);

        this.createUI();

        // DialogManager instance
        this.dialogManager = new DialogManager(scene, { state: this.state });

        // Movement indicator (reticle)
        initializeMovementIndicator(this);
    }

    setInputManager(inputManager) {
        this.inputManager = inputManager;
        this.dialogManager?.setInputManager?.(inputManager);
        return this;
    }

    // Movement indicator (reticle)
    showMovementIndicator(x, y) {
        return showMovementIndicatorReticle(this, x, y);
    }

    hideMovementIndicator() {
        return hideMovementIndicatorReticle(this);
    }

    // Call this from InputManager after pointerdown/up events
    handlePointerMove(screenX, screenY, isDown) {
        return updateMovementIndicatorFromPointer(this, screenX, screenY, isDown);
    }

    createUI() {
        return createUiHud(this);
    }

    createScoreDisplay() {
        return createScoreHud(this);
    }

    createInventoryButton() {
        return createInventoryHudButton(this);
    }

    createQuestButton() {
        return createQuestHudButton(this);
    }

    createHelpButton() {
        return createHelpHudButton(this);
    }

    createVersionDisplay() {
        return createVersionHud(this);
    }

    setState(state) {
        const nextState = state ?? this.state ?? {
            score: 0,
            inventory: [],
            activeQuests: [],
            completedQuests: [],
            isDialogOpen: false,
            isInventoryOpen: false,
            isQuestsOpen: false,
            isHelpOpen: false
        };

        nextState.score = Number.isFinite(nextState.score) ? nextState.score : 0;
        nextState.inventory = Array.isArray(nextState.inventory) ? nextState.inventory : [];
        nextState.activeQuests = Array.isArray(nextState.activeQuests) ? nextState.activeQuests : [];
        nextState.completedQuests = Array.isArray(nextState.completedQuests) ? nextState.completedQuests : [];
        nextState.isDialogOpen = Boolean(nextState.isDialogOpen);
        nextState.isInventoryOpen = Boolean(nextState.isInventoryOpen);
        nextState.isQuestsOpen = Boolean(nextState.isQuestsOpen);
        nextState.isHelpOpen = Boolean(nextState.isHelpOpen);

        this.state = nextState;

        Object.defineProperty(this, 'inventory', {
            configurable: true,
            enumerable: true,
            get: () => this.state.inventory,
            set: (inventory) => {
                this.state.inventory = Array.isArray(inventory) ? inventory : [];
            }
        });

        Object.defineProperty(this, 'score', {
            configurable: true,
            enumerable: true,
            get: () => this.state.score,
            set: (score) => {
                this.state.score = Number.isFinite(score) ? score : 0;
                this.scoreText?.setText(`SCORE: ${this.state.score}`);
            }
        });

        Object.defineProperty(this, 'isInventoryOpen', {
            configurable: true,
            enumerable: true,
            get: () => this.state.isInventoryOpen,
            set: (isInventoryOpen) => {
                this.state.isInventoryOpen = Boolean(isInventoryOpen);
            }
        });

        Object.defineProperty(this, 'isQuestsOpen', {
            configurable: true,
            enumerable: true,
            get: () => this.state.isQuestsOpen,
            set: (isQuestsOpen) => {
                this.state.isQuestsOpen = Boolean(isQuestsOpen);
            }
        });

        Object.defineProperty(this, 'isHelpOpen', {
            configurable: true,
            enumerable: true,
            get: () => this.state.isHelpOpen,
            set: (isHelpOpen) => {
                this.state.isHelpOpen = Boolean(isHelpOpen);
            }
        });

        return this;
    }

    setQuestManager(questManager) {
        this.questManager = questManager;
        return this;
    }

    // Inventory Management
    hasItem(item) {
        const itemKey = item?.id ?? item?.name;

        return this.inventory.some(existingItem => (existingItem.id ?? existingItem.name) === itemKey);
    }

    addItem(item) {
        if (this.hasItem(item)) {
            return false;
        }

        if (this.inventory.length >= this.maxInventorySlots) {
            return false;
        }

        this.inventory.push(item);
        this.addScore(item.value || 0);
        return true;
    }

    collectVendorItem(item, vendorId) {
        if (this.hasItem(item)) {
            return {
                status: 'duplicate',
                message: `You already collected ${item.name}.`
            };
        }

        const itemAdded = this.addItem(item);
        if (!itemAdded) {
            return {
                status: 'inventory-full',
                message: `Inventory full. Make room before taking ${item.name}.`
            };
        }

        const questUpdated = this.questManager?.checkItemCollection(item.name, vendorId) ?? false;
        if (questUpdated) {
            return {
                status: 'quest-updated',
                message: `Collected ${item.name}!\n\nQuest progress updated!`
            };
        }

        return {
            status: 'collected',
            message: this.questManager
                ? `Collected ${item.name}!\n\n(Item added to your collection)`
                : `Collected ${item.name}!`
        };
    }

    toggleInventory() {
        if (this.isInventoryOpen) {
            this.closeDialog();
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

        this.showDialog({
            title: 'Inventory',
            text: inventoryText,
            buttons: [],
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isInventoryOpen = false;
                    this.closeDialog();
                }
            }
        });
    }

    toggleQuests() {
        if (this.isQuestsOpen) {
            this.closeDialog();
            this.isQuestsOpen = false;
            return;
        }

        this.isQuestsOpen = true;
        this.showQuestDialog();
    }

    showQuestDialog(page = 0) {
        if (!this.questManager) {
            this.showDialog({
                title: 'Quests',
                text: 'Quest system not available',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isQuestsOpen = false;
                        this.closeDialog();
                    }
                }
            });
            return;
        }

        const activeQuests = this.questManager.getActiveQuests();
        const completedQuests = this.questManager.getCompletedQuests();

        // Create quest list for pagination
        const questItems = [];

        // Add active quests
        if (activeQuests.length > 0) {
            questItems.push('=== ACTIVE QUESTS ===');
            activeQuests.forEach((quest, index) => {
                questItems.push(`${index + 1}. ${quest.title}`);
                questItems.push(`   ${quest.description}`);
                const completedObjectives = quest.objectives.filter(obj => obj.collected).length;
                const totalObjectives = quest.objectives.length;
                questItems.push(`   Progress: ${completedObjectives}/${totalObjectives} items collected`);
                questItems.push(''); // Empty line for spacing
            });
        } else {
            questItems.push('=== ACTIVE QUESTS ===');
            questItems.push('No active quests');
            questItems.push('');
        }

        // Add completed quests
        if (completedQuests.length > 0) {
            questItems.push('=== COMPLETED QUESTS ===');
            completedQuests.forEach((quest, index) => {
                questItems.push(`${index + 1}. ${quest.title} ✓`);
                questItems.push(`   Reward: ${quest.reward.points} points`);
                questItems.push('');
            });
        }

        this.showDialog({
            title: 'Quests',
            text: questItems,
            textPagination: {
                currentPage: page,
                text: questItems
            },
            buttons: [],
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isQuestsOpen = false;
                    this.closeDialog();
                }
            }
        });
    }

    showQuestCompletion(quest) {
        this.showDialog({
            title: 'Quest Completed!',
            text: `${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`,
            buttons: [{
                label: 'Great!',
                onClick: () => this.closeDialog()
            }]
        });

        // Update quest display if it's open
        if (this.isQuestsOpen) {
            // Refresh the quest dialog if it's currently open
            this.showQuestDialog();
        }
    }

    handleQuestCompletion(quest) {
        this.addScore(quest.reward?.points || 0);
        this.showQuestCompletion(quest);
    }

    // Score Management
    addScore(points) {
        this.score += points;
    }

    updateScore(points) {
        this.addScore(points);
    }

    getScore() {
        return this.score;
    }

    get isDialogOpen() {
        return this.state?.isDialogOpen ?? this.dialogManager?.isDialogOpen ?? false;
    }

    // Dialog System (delegated to DialogManager)
    showDialog(dialogData) {
        this.dialogManager.showDialog(dialogData);
    }

    closeDialog() {
        this.dialogManager.hideDialog();
    }

    // Input handling for UI
    handleInput(key) {
        if (key === 'I' || key === 'i') {
            this.toggleInventory();
        } else if (key === 'Q' || key === 'q') {
            this.toggleQuests();
        } else if (key === 'ESCAPE') {
            // Close any open dialog first
            if (this.isDialogOpen) {
                this.closeDialog();
                // Reset panel states when dialog is closed via ESC
                this.isInventoryOpen = false;
                this.isQuestsOpen = false;
                this.isHelpOpen = false;
            }
        }
    }

    toggleHelp() {
        if (this.isHelpOpen) {
            this.closeDialog();
            this.isHelpOpen = false;
            return;
        }

        this.isHelpOpen = true;

        const helpText = 'HELP\n\n' +
            'Controls:\n' +
            'WASD or Arrow Keys: Move player\n' +
            'Mouse Click: Interact with NPCs\n' +
            'Spacebar: Interact with nearby vendor\n' +
            'ESC: Close dialogs\n' +
            'Backtick (`): Toggle debug mode\n\n' +
            'Gameplay:\n' +
            'Talk to vendors to collect items and complete quests.\n' +
            'Check your inventory and quests using the buttons.\n' +
            'Explore the map to find more vendors!';

        this.showDialog({
            title: 'Help',
            text: helpText,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                }
            }
        });
    }

    createInventoryPanel() {
        // Panel is created on toggle, not here
    }

    createQuestPanel() {
        // Panel is created on toggle, not here
    }
}

export default UIManager;