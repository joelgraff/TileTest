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

        // Create assets
        const assets = {};
        const layoutOptions = {};

        // Title
        assets.title = [this.scene.add.text(0, 0, 'Inventory', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        })];

        // Main text
        const textAsset = this.scene.add.text(0, 0, inventoryText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 400 },
            color: '#000',
            align: 'left'
        });
        assets.mainRight = [textAsset];

        // Create inventory management buttons
        const buttons = [];
        if (this.inventory.length > 0) {
            this.inventory.forEach((item, index) => {
                const button = this.scene.add.text(0, 0, `Drop ${item.name}`, {
                    fontSize: '16px',
                    color: '#000',
                    backgroundColor: '#ccc',
                    padding: { x: 10, y: 5 }
                }).setInteractive().on('pointerdown', () => {
                    this.removeItem(index);
                    this.toggleInventory(); // Refresh dialog
                });
                buttons.push(button);
            });
        }

        if (buttons.length > 0) {
            assets.mainRight.push(...buttons);
            layoutOptions.mainRight = { vertical: true, spacing: 10 };
        }

        // Exit button
        const exitButton = this.scene.add.text(0, 0, 'Close', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => {
            this.isInventoryOpen = false;
            this.closeDialog();
        });
        assets.bottom = [exitButton];
        layoutOptions.bottom = { horizontal: true, spacing: 10 };

        this.dialogManager.showDialog(assets, layoutOptions);
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
            const assets = {
                title: [this.scene.add.text(0, 0, 'Help', {
                    fontSize: '20px',
                    fontStyle: 'bold',
                    color: '#fff',
                    align: 'center'
                })],
                main: [this.scene.add.text(0, 0, 'Loading help data...', {
                    fontSize: '18px',
                    fontStyle: 'bold',
                    wordWrap: { width: 500 },
                    color: '#000',
                    align: 'left'
                })],
                bottom: [this.scene.add.text(0, 0, 'Close', {
                    fontSize: '16px',
                    color: '#000',
                    backgroundColor: '#ccc',
                    padding: { x: 10, y: 5 }
                }).setInteractive().on('pointerdown', () => {
                    this.isHelpOpen = false;
                    this.closeDialog();
                })]
            };
            this.dialogManager.showDialog(assets, { bottom: { horizontal: true, spacing: 10 } });
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

        // Create assets
        const assets = {};
        const layoutOptions = {};

        // Title
        assets.title = [this.scene.add.text(0, 0, 'Help Topics', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        })];

        // Main text
        const textAsset = this.scene.add.text(0, 0, 'Select a topic below to view detailed help information:', {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 500 },
            color: '#000',
            align: 'left',
            origin: 0.0
        });
        assets.main = [textAsset];

        // Topic buttons as link-style buttons
        const topicButtons = [];
        Object.keys(topics).forEach(topicKey => {
            const topic = topics[topicKey];
            const button = this.scene.add.text(0, 0, topic.title, {
                fontSize: '16px',
                color: '#00f',
                backgroundColor: 'transparent'
            }).setInteractive().on('pointerdown', () => this.showHelpDialog(topicKey));
            topicButtons.push(button);
        });

        assets.main.push(...topicButtons);
        layoutOptions.main = { vertical: true, spacing: 10 };

        // Exit button
        const exitButton = this.scene.add.text(0, 0, 'Close', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => {
            this.isHelpOpen = false;
            this.closeDialog();
        });
        assets.bottom = [exitButton];
        layoutOptions.bottom = { horizontal: true, spacing: 10 };

        this.dialogManager.showDialog(assets, layoutOptions);
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

        // Create assets
        const assets = {};
        const layoutOptions = {};

        // Title
        assets.title = [this.scene.add.text(0, 0, topic.title, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        })];

        // Main text
        console.log(displayText);
        const textAsset = this.scene.add.text(0, 0, displayText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 400 },
            color: '#000',
            align: 'left'
        });
        assets.mainRight = [textAsset];

        // Left buttons (pagination and back)
        const leftButtons = [];

        // Add pagination buttons if multiple pages
        if (totalPages > 1) {
            const prevButton = this.scene.add.text(0, 0, '<', {
                fontSize: '16px',
                color: currentPage <= 0 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage > 0) {
                prevButton.setInteractive().on('pointerdown', () => this.showTopicContent(topicKey, currentPage - 1));
            }
            leftButtons.push(prevButton);

            const nextButton = this.scene.add.text(0, 0, '>', {
                fontSize: '16px',
                color: currentPage >= totalPages - 1 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage < totalPages - 1) {
                nextButton.setInteractive().on('pointerdown', () => this.showTopicContent(topicKey, currentPage + 1));
            }
            leftButtons.push(nextButton);
        }

        // Add "Back to Topics" button
        const backButton = this.scene.add.text(0, 0, 'Back to Topics', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => this.showHelpDialog());

        assets.mainLeft = leftButtons;
        layoutOptions.mainLeft = { horizontal: true, spacing: 10 };

        // Bottom buttons
        const exitButton = this.scene.add.text(0, 0, 'Close', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => {
            this.isHelpOpen = false;
            this.closeDialog();
        });
        assets.bottom = [backButton, exitButton];
        layoutOptions.bottom = { horizontal: true, spacing: 10 };

        this.dialogManager.showDialog(assets, layoutOptions);
    }

    showQuestDialog(page = 0) {
        if (!this.scene.questManager) {
            const assets = {
                title: [this.scene.add.text(0, 0, 'Quests', {
                    fontSize: '20px',
                    fontStyle: 'bold',
                    color: '#fff',
                    align: 'center'
                })],
                mainRight: [this.scene.add.text(0, 0, 'Quest system not available', {
                    fontSize: '18px',
                    fontStyle: 'bold',
                    wordWrap: { width: 400 },
                    color: '#000',
                    align: 'left'
                })],
                bottom: [this.scene.add.text(0, 0, 'Close', {
                    fontSize: '16px',
                    color: '#000',
                    backgroundColor: '#ccc',
                    padding: { x: 10, y: 5 }
                }).setInteractive().on('pointerdown', () => {
                    this.isQuestsOpen = false;
                    this.closeDialog();
                })]
            };
            this.dialogManager.showDialog(assets, { bottom: { horizontal: true, spacing: 10 } });
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

        // Use ContentProcessor for pagination
        const contentProcessor = this.dialogManager.getContentProcessor();
        const pages = contentProcessor.paginateText(questItems.join('\n'), 9);
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);
        const displayText = pages[currentPage];

        // Create assets
        const assets = {};
        const layoutOptions = {};

        // Title
        assets.title = [this.scene.add.text(0, 0, 'Quests', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        })];

        // Main text
        const textAsset = this.scene.add.text(0, 0, displayText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 400 },
            color: '#000',
            align: 'left'
        });
        assets.mainRight = [textAsset];

        // Pagination buttons if needed
        if (totalPages > 1) {
            const leftButtons = [];
            const prevButton = this.scene.add.text(0, 0, '<', {
                fontSize: '16px',
                color: currentPage <= 0 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage > 0) {
                prevButton.setInteractive().on('pointerdown', () => this.showQuestDialog(currentPage - 1));
            }
            leftButtons.push(prevButton);

            const nextButton = this.scene.add.text(0, 0, '>', {
                fontSize: '16px',
                color: currentPage >= totalPages - 1 ? '#666' : '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            });
            if (currentPage < totalPages - 1) {
                nextButton.setInteractive().on('pointerdown', () => this.showQuestDialog(currentPage + 1));
            }
            leftButtons.push(nextButton);

            assets.mainLeft = leftButtons;
            layoutOptions.mainLeft = { vertical: true, spacing: 10 };
        }

        // Exit button
        const exitButton = this.scene.add.text(0, 0, 'Close', {
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#ccc',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => {
            this.isQuestsOpen = false;
            this.closeDialog();
        });
        assets.bottom = [exitButton];
        layoutOptions.bottom = { horizontal: true, spacing: 10 };

        this.dialogManager.showDialog(assets, layoutOptions);
    }

    showQuestCompletion(quest) {
        const assets = {
            title: [this.scene.add.text(0, 0, 'Quest Completed!', {
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#fff',
                align: 'center'
            })],
            mainRight: [this.scene.add.text(0, 0, `${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`, {
                fontSize: '18px',
                fontStyle: 'bold',
                wordWrap: { width: 400 },
                color: '#000',
                align: 'left'
            })],
            bottom: [this.scene.add.text(0, 0, 'Great!', {
                fontSize: '16px',
                color: '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            }).setInteractive().on('pointerdown', () => this.closeDialog())]
        };

        this.dialogManager.showDialog(assets, { bottom: { horizontal: true, spacing: 10 } });

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
        // Create assets grouped by container
        const assets = {};
        const layoutOptions = {};

        // Create title asset
        if (dialogData.title) {
            assets.title = [this.scene.add.text(0, 0, dialogData.title, {
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#fff',
                align: 'center'
            })];
        }

        // Create main content assets
        if (dialogData.text) {
            const textContent = Array.isArray(dialogData.text) ? dialogData.text.join('\n') : dialogData.text;
            const textAsset = this.scene.add.text(0, 0, textContent, {
                fontSize: '18px',
                fontStyle: 'bold',
                wordWrap: { width: 400 },
                color: '#000',
                align: 'left'
            });
            assets.mainRight = [textAsset];
        }

        // Create image asset if provided
        if (dialogData.imageKey) {
            const imageAsset = this.scene.add.image(0, 0, dialogData.imageKey)
                .setDisplaySize(90, 134)
                .setOrigin(0.5, 0.5);
            assets.mainLeft = [imageAsset];
        }

        // Create button assets
        const buttons = [];
        if (dialogData.buttons) {
            dialogData.buttons.forEach(buttonConfig => {
                const button = this.scene.add.text(0, 0, buttonConfig.label, {
                    fontSize: '16px',
                    color: '#000',
                    backgroundColor: '#ccc',
                    padding: { x: 10, y: 5 }
                }).setInteractive().on('pointerdown', buttonConfig.onClick);
                buttons.push(button);
            });
        }

        // Create left buttons
        const leftButtons = [];
        if (dialogData.leftButtons) {
            dialogData.leftButtons.forEach(buttonConfig => {
                const button = this.scene.add.text(0, 0, buttonConfig.label, {
                    fontSize: '16px',
                    color: '#000',
                    backgroundColor: '#ccc',
                    padding: { x: 10, y: 5 }
                }).setInteractive().on('pointerdown', buttonConfig.onClick);
                leftButtons.push(button);
            });
        }

        // Create exit button
        if (dialogData.exitButton) {
            const exitButton = this.scene.add.text(0, 0, dialogData.exitButton.label, {
                fontSize: '16px',
                color: '#000',
                backgroundColor: '#ccc',
                padding: { x: 10, y: 5 }
            }).setInteractive().on('pointerdown', dialogData.exitButton.onClick);
            assets.bottom = [exitButton];
            layoutOptions.bottom = { horizontal: true, spacing: 10 };
        }

        // Add buttons to appropriate containers
        if (buttons.length > 0) {
            // For vendor dialogs with both text and buttons in mainRight,
            // position buttons at the bottom of the right column
            if (dialogData.text && assets.mainRight && assets.mainRight.length > 0) {
                // Add buttons to mainRight with bottom positioning
                assets.mainRight.push(...buttons);
                // Use a custom layout that positions text at top, buttons at bottom
                layoutOptions.mainRight = {
                    vertical: true,
                    spacing: 10,
                    bottomAlignButtons: true
                };
            } else {
                // Default behavior: buttons in mainRight
                assets.mainRight = assets.mainRight || [];
                assets.mainRight.push(...buttons);
                layoutOptions.mainRight = { vertical: true, spacing: 10 };
            }
        }

        if (leftButtons.length > 0) {
            assets.mainLeft = assets.mainLeft || [];
            assets.mainLeft.push(...leftButtons);
            layoutOptions.mainLeft = { vertical: true, spacing: 10 };
        }

        // Call the new dialogManager.showDialog
        this.dialogManager.showDialog(assets, layoutOptions);
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