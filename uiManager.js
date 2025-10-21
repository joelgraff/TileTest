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
        this.scoreBackground = this.scene.add.rectangle(100, 25, 180, 40, 0x808080)
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
        this.invButton = this.scene.add.rectangle(720, 60, 80, 30, 0x808080)  // Moved to right edge, below QUESTS
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
            this.invButton.setFillStyle(0xC0C0C0);
        });

        this.invButton.on('pointerout', () => {
            this.invButton.setFillStyle(0x808080);
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
        this.questButton = this.scene.add.rectangle(720, 25, 80, 30, 0x808080)  // Moved to right edge, top position
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
            this.questButton.setFillStyle(0xC0C0C0);
        });

        this.questButton.on('pointerout', () => {
            this.questButton.setFillStyle(0x808080);
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
        this.helpButton = this.scene.add.rectangle(720, 95, 80, 30, 0x808080)  // Below PACK button
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
            this.helpButton.setFillStyle(0xC0C0C0);
        });

        this.helpButton.on('pointerout', () => {
            this.helpButton.setFillStyle(0x808080);
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
                    this.closeDialog();
                }
            }
        };

        this.showDialog(dialogData);
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
        // Load help data from help.md
        fetch('help.md')
            .then(response => response.text())
            .then(markdownContent => {
                const contentProcessor = this.dialogManager.getContentProcessor();
                this.helpData = contentProcessor.parseHelpMarkdown(markdownContent);
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
            const dialogData = {
                title: 'Help',
                text: 'Loading help data...',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isHelpOpen = false;
                        this.closeDialog();
                    }
                }
            };
            this.showDialog(dialogData);
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
        const topics = this.helpData.topics;

        // Create topic buttons
        const buttons = [];
        Object.keys(topics).forEach(topicKey => {
            const topic = topics[topicKey];
            buttons.push({
                label: topic.title,
                onClick: () => this.showHelpDialog(topicKey)
            });
        });

        // Create dialog content object
        const dialogData = {
            title: 'Help Topics',
            text: 'Select a topic below to view detailed help information:',
            buttons: buttons,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                }
            }
        };

        this.showDialog(dialogData);
    }

    showTopicContent(topicKey, page = 0) {
        const topic = this.helpData.topics[topicKey];
        if (!topic) {
            this.showHelpDialog(); // Go back to topic selection
            return;
        }

        // Use ContentProcessor for pagination
        const contentProcessor = this.dialogManager.getContentProcessor();
        const pages = contentProcessor.paginateText(topic.content.join('\n'), 9);
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);
        const displayText = pages[currentPage];

        // Create left buttons (pagination)
        const leftButtons = [];

        // Add pagination buttons if multiple pages
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: () => this.showTopicContent(topicKey, currentPage - 1)
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: () => this.showTopicContent(topicKey, currentPage + 1)
            });
        }

        // Create bottom buttons
        const bottomButtons = [
            {
                label: 'Back to Topics',
                onClick: () => this.showHelpDialog()
            },
            {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                }
            }
        ];

        // Create dialog content object
        const dialogData = {
            title: topic.title,
            text: displayText,
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            bottomButtons: bottomButtons
        };

        this.showDialog(dialogData);
    }

    showQuestDialog(page = 0) {
        if (!this.scene.questManager) {
            const dialogData = {
                title: 'Quests',
                text: 'Quest system not available',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isQuestsOpen = false;
                        this.closeDialog();
                    }
                }
            };
            this.showDialog(dialogData);
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
                questItems.push(`\n${index + 1}. ${quest.title}`);
                questItems.push(`\n${quest.description}`);
                const completedObjectives = quest.objectives.filter(obj => obj.collected).length;
                const totalObjectives = quest.objectives.length;
                questItems.push(`\nProgress: ${completedObjectives}/${totalObjectives} items collected`);
                questItems.push(''); // Empty line for spacing
            });
        } else {
               // Add active quests
               if (activeQuests.length > 0) {
                   questItems.push('=== ACTIVE QUESTS ===');
                   activeQuests.forEach((quest, index) => {
                       questItems.push(`\n${index + 1}. ${quest.title}`);
                       questItems.push(`\n${quest.description}`);
                       const completedObjectives = quest.objectives.filter(obj => obj.collected).length;
                       const totalObjectives = quest.objectives.length;
                       questItems.push(`\nProgress: ${completedObjectives}/${totalObjectives} items collected`);
                       questItems.push(''); // Empty line for spacing
                   });
               } else {
                   questItems.push('No active quests');
                   questItems.push('');
               }
        const contentProcessor = this.dialogManager.getContentProcessor();
        const pages = contentProcessor.paginateText(questItems.join('\n'), 9);
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);
        const displayText = pages[currentPage];

        // Create pagination buttons if needed
        const leftButtons = [];
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: () => this.showQuestDialog(currentPage - 1)
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: () => this.showQuestDialog(currentPage + 1)
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Quests',
            text: displayText,
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isQuestsOpen = false;
                    this.closeDialog();
                }
            }
        };

        this.showDialog(dialogData);
    }}

    showQuestCompletion(quest) {
        const dialogData = {
            title: 'Quest Completed!',
            text: `${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`,
            exitButton: {
                label: 'Great!',
                onClick: () => this.closeDialog()
            }
        };

        this.showDialog(dialogData);

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
        // Create content objects instead of Phaser assets
        const content = {
            title: dialogData.title,
            text: dialogData.text,
            imageKey: dialogData.imageKey,
            buttons: dialogData.buttons,
            leftButtons: dialogData.leftButtons,
            exitButton: dialogData.exitButton,
            bottomButtons: dialogData.bottomButtons
        };

        // Use explicit dialogType if provided, else determine automatically
        const dialogType = dialogData.dialogType || this.determineDialogType(content);
        console.log('UIManager: content:', content);
        // Convert content to assets using the appropriate dialog type
        const assets = this.createAssetsForDialog(content, dialogType);

        // Call DialogManager with type and assets
        this.dialogManager.showDialog(assets.assets, assets.layoutOptions, dialogType);
    }

    /**
     * Determine the appropriate dialog type based on content
     * @param {Object} content - Dialog content object
     * @returns {string} Dialog type
     */
    determineDialogType(content) {
        // Interaction dialogs have navigation buttons or complex button layouts
        if (content.leftButtons || content.bottomButtons ||
            (content.buttons && content.buttons.length > 3)) {
            return 'interaction';
        }

        // Default dialogs are simple: title, text, image, close button
        return 'default';
    }

    /**
     * Create assets for the specified dialog type
     * @param {Object} content - Dialog content object
     * @param {string} dialogType - Dialog type
     * @returns {Object} Assets and layout options
     */
    createAssetsForDialog(content, dialogType) {
        const assets = {};
        const layoutOptions = {};

        // Create title asset
        if (content.title) {
            assets.title = { type: 'text', text: content.title, style: { fontSize: '20px', fontStyle: 'bold', color: '#fff', align: 'center' } };
        }

        // Create image asset if provided
        if (content.imageKey) {
            console.log('UIManager: Creating image asset for mainLeft:', content.imageKey);
            assets.mainLeft = [{ type: 'image', key: content.imageKey, displaySize: { width: 90, height: 134 }, isAvatar: true }];
        }

        // Create text content
        if (content.text) {
            const textContent = Array.isArray(content.text) ? content.text.join('\n') : content.text;
            assets.mainRight = [{ type: 'text', text: textContent, style: { fontSize: '18px', fontStyle: 'bold', wordWrap: { width: 400 }, color: '#000', align: 'left' } }];
        }

        // Create button assets based on dialog type
        if (dialogType === 'interaction') {
            this.createInteractionDialogAssets(content, assets, layoutOptions);
        } else {
            this.createDefaultDialogAssets(content, assets, layoutOptions);
        }

        return { assets, layoutOptions };
    }

    /**
     * Create assets for default dialog type
     * @param {Object} content - Dialog content
     * @param {Object} assets - Assets object to populate
     * @param {Object} layoutOptions - Layout options to populate
     */
    createDefaultDialogAssets(content, assets, layoutOptions) {
        // Create button assets for main content
        const buttons = [];
        if (content.buttons) {
            content.buttons.forEach(buttonConfig => {
                const button = { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick };
                buttons.push(button);
            });
        }

        // Add buttons to mainRight with bottom alignment
        if (buttons.length > 0) {
            if (!assets.mainRight) assets.mainRight = [];
            assets.mainRight.push(...buttons);
            layoutOptions.mainRight = {
                vertical: true,
                spacing: 10,
                bottomAlignButtons: true
            };
        }

        // Create exit button for bottom
        if (content.exitButton) {
            assets.bottom = [{ type: 'button', label: content.exitButton.label, onClick: content.exitButton.onClick }];
            layoutOptions.bottom = { horizontal: true, spacing: 10 };
        }

        // Assign left buttons to mainLeft if present
        if (content.leftButtons) {
            if (!assets.mainLeft) assets.mainLeft = [];
            content.leftButtons.forEach(buttonConfig => {
                const button = { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick };
                assets.mainLeft.push(button);
            });
        }

        // For dialogs with imageKey and bottomButtons, assign bottomButtons to mainLeft
        if (content.bottomButtons && content.imageKey) {
            if (!assets.mainLeft) assets.mainLeft = [];
            content.bottomButtons.forEach(buttonConfig => {
                const button = { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick, disabled: buttonConfig.disabled, options: { width: 60 } };
                assets.mainLeft.push(button);
            });
            layoutOptions.mainLeft = { horizontal: true, spacing: 10 };
        }
    }

    /**
     * Create assets for interaction dialog type
     * @param {Object} content - Dialog content
     * @param {Object} assets - Assets object to populate
     * @param {Object} layoutOptions - Layout options to populate
     */
    createInteractionDialogAssets(content, assets, layoutOptions) {
        // Create left buttons (navigation/back) -- assign to mainRightButtons for interaction dialogs
        if (content.leftButtons) {
            if (!assets.mainRightButtons) assets.mainRightButtons = [];
            content.leftButtons.forEach(buttonConfig => {
                const button = { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick, options: { ...(buttonConfig.options || {}) } };
                assets.mainRightButtons.push(button);
            });
            // layoutOptions.mainRightButtons already set below
        }

        // Create main buttons (for right column)
        if (content.buttons) {
            const buttons = content.buttons.map(buttonConfig => {
                return { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick, options: { ...(buttonConfig.options || {}) } };
            });
            assets.mainRightButtons = buttons;
            layoutOptions.mainRightButtons = { vertical: true, spacing: 10 };
        }

        // Create bottom buttons (pagination, etc.)
        if (content.bottomButtons) {
            const bottomButtons = content.bottomButtons.map(buttonConfig => {
                return { type: 'button', label: buttonConfig.label, onClick: buttonConfig.onClick, disabled: buttonConfig.disabled, options: { ...(content.imageKey ? { width: 60 } : {}), ...(buttonConfig.options || {}) } };
            });
            if (content.imageKey) {
                // For dialogs with avatar, put navigation buttons in mainLeft
                if (!assets.mainLeft) assets.mainLeft = [];
                assets.mainLeft.push(...bottomButtons);
                // Ensure the Back (exit) button is left-aligned in bottom area and matches nav button style
                layoutOptions.bottom = { leftAlign: true };
            } else {
                // Normal case, put in bottom
                assets.bottom = bottomButtons;
                layoutOptions.bottom = {
                    horizontal: true,
                    spacing: 10
                };
            }
        }

        // Create exit button
        if (content.exitButton) {
            const exitButton = { type: 'button', label: content.exitButton.label, onClick: content.exitButton.onClick, options: { ...(content.exitButton.options || {}) } };
            assets.bottom = (assets.bottom || []).concat([exitButton]);
            // If we're in an interaction dialog with avatar (pagination in left), we want this left-aligned
            layoutOptions.bottom = { ...(layoutOptions.bottom || {}), leftAlign: !!content.imageKey };
        }
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