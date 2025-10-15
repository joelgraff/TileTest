import DialogManager from './dialogManager.js';

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.inventory = [];
        this.score = 0;
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
        this.isQuestsOpen = false; // Track quest panel visibility

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

        // Create inventory panel (initially hidden)
        this.createInventoryPanel();

        // Create quest panel (initially hidden)
        this.createQuestPanel();

        // Create version display
        this.createVersionDisplay();
    }

    createScoreDisplay() {
        this.scoreBackground = this.scene.add.rectangle(100, 25, 180, 40, this.colors.background)
            .setScrollFactor(0)
            .setDepth(100);

        this.scoreBorderOuter = this.scene.add.rectangle(100, 25, 180, 40, this.colors.border)
            .setScrollFactor(0)
            .setDepth(99)
            .setStrokeStyle(2, this.colors.border);

        this.scoreBorderInner = this.scene.add.rectangle(100, 25, 176, 36, this.colors.background)
            .setScrollFactor(0)
            .setDepth(101)
            .setStrokeStyle(1, this.colors.text);

        this.scoreText = this.scene.add.text(100, 25, 'SCORE: 0', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(102);
    }

    createInventoryButton() {
        this.invButton = this.scene.add.rectangle(700, 25, 80, 30, this.colors.button)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, this.colors.border)
            .setInteractive({ cursor: 'pointer' });

        this.invButtonText = this.scene.add.text(700, 25, 'PACK', {
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
            this.toggleInventory();
        });
    }

    createQuestButton() {
        this.questButton = this.scene.add.rectangle(620, 25, 80, 30, this.colors.button)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, this.colors.border)
            .setInteractive({ cursor: 'pointer' });

        this.questButtonText = this.scene.add.text(620, 25, 'QUESTS', {
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
            this.toggleQuests();
        });
    }

    createInventoryPanel() {
        this.inventoryPanel = this.scene.add.group();

        this.invBackground = this.scene.add.rectangle(400, 300, 400, 300, this.colors.background)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        this.invBorderOuter = this.scene.add.rectangle(400, 300, 400, 300, this.colors.border)
            .setScrollFactor(0)
            .setDepth(199)
            .setStrokeStyle(3, this.colors.border)
            .setVisible(false);

        this.invBorderInner = this.scene.add.rectangle(400, 300, 396, 296, this.colors.background)
            .setScrollFactor(0)
            .setDepth(201)
            .setStrokeStyle(1, this.colors.text)
            .setVisible(false);

        this.invTitle = this.scene.add.text(400, 180, 'INVENTORY', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            fill: '#FFFF00',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(202)
        .setVisible(false);

        this.inventorySlots = [];
        for (let i = 0; i < this.maxInventorySlots; i++) {
            const x = 280 + (i % 4) * 60;
            const y = 220 + Math.floor(i / 4) * 60;

            const slot = this.scene.add.rectangle(x, y, 50, 50, this.colors.shadow)
                .setScrollFactor(0)
                .setDepth(202)
                .setStrokeStyle(2, this.colors.text)
                .setVisible(false)
                .setInteractive({ cursor: 'pointer' });

            slot.slotIndex = i;
            this.inventorySlots.push(slot);
        }

        this.invCloseButton = this.scene.add.rectangle(500, 180, 60, 25, this.colors.button)
            .setScrollFactor(0)
            .setDepth(202)
            .setStrokeStyle(1, this.colors.border)
            .setVisible(false)
            .setInteractive({ cursor: 'pointer' });

        this.invCloseText = this.scene.add.text(500, 180, 'CLOSE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '10px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(203)
        .setVisible(false);

        this.invCloseButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.toggleInventory();
        });

        this.inventoryPanel.addMultiple([
            this.invBackground, this.invBorderOuter, this.invBorderInner,
            this.invTitle, this.invCloseButton, this.invCloseText,
            ...this.inventorySlots
        ]);
    }

    createQuestPanel() {
        this.questPanel = this.scene.add.group();

        this.questBackground = this.scene.add.rectangle(400, 300, 500, 400, this.colors.background)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        this.questBorderOuter = this.scene.add.rectangle(400, 300, 500, 400, this.colors.border)
            .setScrollFactor(0)
            .setDepth(199)
            .setStrokeStyle(3, this.colors.border)
            .setVisible(false);

        this.questBorderInner = this.scene.add.rectangle(400, 300, 496, 396, this.colors.background)
            .setScrollFactor(0)
            .setDepth(201)
            .setStrokeStyle(1, this.colors.text)
            .setVisible(false);

        this.questTitle = this.scene.add.text(400, 140, 'ACTIVE QUESTS', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            fill: '#FFFF00',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(202)
        .setVisible(false);

        this.questText = this.scene.add.text(400, 180, 'No active quests', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center',
            wordWrap: { width: 460 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(202)
        .setVisible(false);

        this.questCloseButton = this.scene.add.rectangle(550, 140, 60, 25, this.colors.button)
            .setScrollFactor(0)
            .setDepth(202)
            .setStrokeStyle(1, this.colors.border)
            .setVisible(false)
            .setInteractive({ cursor: 'pointer' });

        this.questCloseText = this.scene.add.text(550, 140, 'CLOSE', {
            fontFamily: 'Courier New, monospace',
            fontSize: '10px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(203)
        .setVisible(false);

        this.questCloseButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.toggleQuests();
        });
        this.questPanel.addMultiple([
            this.questBackground, this.questBorderOuter, this.questBorderInner,
            this.questTitle, this.questText, this.questCloseButton, this.questCloseText
        ]);
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
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }

    removeItem(index) {
        if (index >= 0 && index < this.inventory.length) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }

    updateInventoryDisplay() {
        this.inventorySlots.forEach((slot, index) => {
            if (index < this.inventory.length) {
                slot.setFillStyle(this.colors.button);
            } else {
                slot.setFillStyle(this.colors.shadow);
            }
        });
    }

    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;

        this.inventoryPanel.getChildren().forEach(child => {
            child.setVisible(this.isInventoryOpen);
        });

        if (this.isInventoryOpen) {
            this.updateInventoryDisplay();
        }
    }

    toggleQuests() {
        this.isQuestsOpen = !this.isQuestsOpen;

        this.questPanel.getChildren().forEach(child => {
            child.setVisible(this.isQuestsOpen);
        });

        if (this.isQuestsOpen) {
            this.updateQuestDisplay();
        }
    }

    updateQuestDisplay() {
        if (!this.scene.questManager) {
            this.questText.setText('Quest system not available');
            return;
        }

        const activeQuests = this.scene.questManager.getActiveQuests();
        const completedQuests = this.scene.questManager.getCompletedQuests();

        let questDisplayText = '';

        if (activeQuests.length > 0) {
            questDisplayText += 'ACTIVE QUESTS:\n\n';
            activeQuests.forEach((quest, index) => {
                questDisplayText += `${index + 1}. ${quest.title}\n`;
                questDisplayText += `${quest.description}\n`;

                const completedObjectives = quest.objectives.filter(obj => obj.collected).length;
                const totalObjectives = quest.objectives.length;
                questDisplayText += `Progress: ${completedObjectives}/${totalObjectives} items collected\n\n`;
            });
        } else {
            questDisplayText += 'No active quests\n\n';
        }

        if (completedQuests.length > 0) {
            questDisplayText += 'COMPLETED QUESTS:\n\n';
            completedQuests.forEach((quest, index) => {
                questDisplayText += `${index + 1}. ${quest.title} ✓\n`;
                questDisplayText += `Reward: ${quest.reward.points} points\n\n`;
            });
        }

        this.questText.setText(questDisplayText);
    }

    showQuestCompletion(quest) {
        this.showDialog({
            text: `Quest Completed!\n\n${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`,
            buttons: [{
                label: 'Great!',
                onClick: () => this.closeDialog()
            }]
        });

        // Update quest display if it's open
        if (this.isQuestsOpen) {
            this.updateQuestDisplay();
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
        } else if (key === 'ESCAPE') {
            this.closeDialog();
            if (this.isInventoryOpen) {
                this.toggleInventory();
            }
            if (this.isQuestsOpen) {
                this.toggleQuests();
            }
        }
    }
}

export default UIManager;