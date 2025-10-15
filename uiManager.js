import DialogManager from './dialogManager.js';

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.inventory = [];
        this.score = 0;
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
        this.isQuestsOpen = false; // Track quest panel visibility
        this.isHelpOpen = false; // Track help dialog visibility

        // Load help data
        this.loadHelpData();

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

        this.createUI();

        // DialogManager instance
        this.dialogManager = new DialogManager(scene);

        // Movement indicator (reticle)
        this.movementIndicator = this.scene.add.graphics();
        this.movementIndicator.setDepth(999);
        this.movementIndicator.setVisible(false);
        this.movementIndicator.alpha = 1;
        this.movementIndicatorFadeTween = null;
    }
    // Movement indicator (reticle)
    showMovementIndicator(x, y) {
        this.movementIndicator.clear();
        // Draw reticle: circle + crosshair
        this.movementIndicator.lineStyle(4, 0xFFFF00, 1);
        this.movementIndicator.strokeCircle(x, y, 16);
        this.movementIndicator.lineStyle(2, 0xFFFFFF, 1);
        this.movementIndicator.beginPath();
        this.movementIndicator.moveTo(x - 12, y);
        this.movementIndicator.lineTo(x + 12, y);
        this.movementIndicator.moveTo(x, y - 12);
        this.movementIndicator.lineTo(x, y + 12);
        this.movementIndicator.strokePath();
        this.movementIndicator.setVisible(true);
        this.movementIndicator.alpha = 1;
        if (this.movementIndicatorFadeTween) {
            this.movementIndicatorFadeTween.stop();
            this.movementIndicatorFadeTween = null;
        }
    }

    hideMovementIndicator() {
        if (this.movementIndicatorFadeTween) {
            this.movementIndicatorFadeTween.stop();
        }
        this.movementIndicatorFadeTween = this.scene.tweens.add({
            targets: this.movementIndicator,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.movementIndicator.setVisible(false);
            }
        });
    }

    // Call this from InputManager after pointerdown/up events
    handlePointerMove(screenX, screenY, isDown) {
        if (isDown) {
            // Convert screen coordinates to world coordinates
            const worldPoint = this.scene.cameras.main.getWorldPoint(screenX, screenY);
            this.showMovementIndicator(worldPoint.x, worldPoint.y);
        } else {
            this.hideMovementIndicator();
        }
    }

    createUI() {
        // Create score display
        this.createScoreDisplay();

        // Create inventory button
        this.createInventoryButton();

        // Create quest button
        this.createQuestButton();

        // Create help button
        this.createHelpButton();

        // Create version display
        this.createVersionDisplay();
    }

    createScoreDisplay() {
        this.scoreBackground = this.scene.add.rectangle(100, 25, 180, 40, this.colors.button)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF);  // White border to match buttons

        this.scoreText = this.scene.add.text(100, 25, 'SCORE: 0', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
    }

    createInventoryButton() {
        this.invButton = this.scene.add.rectangle(720, 60, 80, 30, this.colors.button)  // Moved to right edge, below QUESTS
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.invButtonText = this.scene.add.text(720, 60, 'PACK', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.invButton.on('pointerover', () => {
            this.invButton.setFillStyle(this.colors.buttonHover);
        });

        this.invButton.on('pointerout', () => {
            this.invButton.setFillStyle(this.colors.button);
        });

        this.invButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleInventory();
        });
    }

    createQuestButton() {
        this.questButton = this.scene.add.rectangle(720, 25, 80, 30, this.colors.button)  // Moved to right edge, top position
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.questButtonText = this.scene.add.text(720, 25, 'QUESTS', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.questButton.on('pointerover', () => {
            this.questButton.setFillStyle(this.colors.buttonHover);
        });

        this.questButton.on('pointerout', () => {
            this.questButton.setFillStyle(this.colors.button);
        });

        this.questButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleQuests();
        });
    }

    createHelpButton() {
        this.helpButton = this.scene.add.rectangle(720, 95, 80, 30, this.colors.button)  // Below PACK button
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.helpButtonText = this.scene.add.text(720, 95, 'HELP', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.helpButton.on('pointerover', () => {
            this.helpButton.setFillStyle(this.colors.buttonHover);
        });

        this.helpButton.on('pointerout', () => {
            this.helpButton.setFillStyle(this.colors.button);
        });

        this.helpButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleHelp();
        });
    }

    createVersionDisplay() {
        this.versionText = this.scene.add.text(10, 620, 'Version 1.6', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'left'
        })
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100);
    }

    // Inventory Management
    addItem(item) {
        if (this.inventory.length < this.maxInventorySlots) {
            this.inventory.push(item);
            this.updateScore(item.value || 0);
            return true;
        }
        return false;
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

        // Create inventory management buttons
        const buttons = [];
        if (this.inventory.length > 0) {
            // Add buttons for each item to potentially remove/use them
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

        this.showDialog({
            title: 'Inventory',
            text: inventoryText,
            buttons: buttons,
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

    loadHelpData() {
        // Load help data from help.json
        fetch('help.json')
            .then(response => response.json())
            .then(data => {
                this.helpData = data;
            })
            .catch(error => {
                console.error('Failed to load help data:', error);
                this.helpData = { topics: {} };
            });
    }

    toggleHelp() {
        if (this.isHelpOpen) {
            this.closeDialog();
            this.isHelpOpen = false;
            return;
        }

        this.isHelpOpen = true;
        this.showHelpDialog();
    }

    showHelpDialog(selectedTopic = null) {
        if (!this.helpData) {
            this.showDialog({
                title: 'Help',
                text: 'Loading help data...',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isHelpOpen = false;
                        this.closeDialog();
                    }
                }
            });
            return;
        }

        if (selectedTopic && this.helpData.topics[selectedTopic]) {
            // Show specific topic content
            this.showTopicContent(selectedTopic);
        } else {
            // Show topic selection
            this.showTopicSelection();
        }
    }

    showTopicSelection() {
        const topicButtons = [];
        const topics = this.helpData.topics;

        // Create buttons for each topic
        Object.keys(topics).forEach(topicKey => {
            const topic = topics[topicKey];
            topicButtons.push({
                label: topic.title,
                onClick: () => {
                    this.showHelpDialog(topicKey);
                }
            });
        });

        this.showDialog({
            title: 'Help Topics',
            text: 'Select a topic below to view detailed help information:',
            buttons: topicButtons,
            useLinkButtons: true,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                }
            }
        });
    }

    showTopicContent(topicKey, page = 0) {
        const topic = this.helpData.topics[topicKey];
        if (!topic) {
            this.showHelpDialog(); // Go back to topic selection
            return;
        }

        // Calculate pages for this topic
        const pages = this.dialogManager.calculateTextPages(topic.content, 15); // Use 5 lines per page for help content (reduced spacing)
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);

        // Get the text for current page
        const displayText = pages[currentPage].join('\n');

        // Create left buttons
        const leftButtons = [];

        // Add pagination buttons if multiple pages
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: currentPage > 0 ? () => this.showTopicContent(topicKey, currentPage - 1) : () => {}
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: currentPage < totalPages - 1 ? () => this.showTopicContent(topicKey, currentPage + 1) : () => {}
            });
        }

        // Add "Back to Topics" button
        leftButtons.push({
            label: 'Back to Topics',
            onClick: () => {
                this.showHelpDialog(); // Go back to topic selection
            }
        });

        this.showDialog({
            title: topic.title,
            text: displayText,
            leftButtons: leftButtons,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                }
            }
        });
    }

    showQuestDialog(page = 0) {
        if (!this.scene.questManager) {
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

        const activeQuests = this.scene.questManager.getActiveQuests();
        const completedQuests = this.scene.questManager.getCompletedQuests();

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

    // Score Management
    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
    }

    getScore() {
        return this.score;
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
        } else if (key === 'H' || key === 'h') {
            this.toggleHelp();
        } else if (key === 'ESCAPE') {
            // Close any open dialog first
            if (this.scene.isDialogOpen) {
                this.closeDialog();
                // Reset panel states when dialog is closed via ESC
                this.isInventoryOpen = false;
                this.isQuestsOpen = false;
                this.isHelpOpen = false;
            }
        }
    }
}

export default UIManager;