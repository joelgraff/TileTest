// UI Manager for VCF Quest with Sierra-style graphics
class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.inventory = [];
        this.score = 0;
        this.maxInventorySlots = 8;
        this.isInventoryOpen = false;
        this.isDialogOpen = false;
        this.currentDialog = null;

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
    }

    createUI() {
        // Create score display
        this.createScoreDisplay();

        // Create inventory button
        this.createInventoryButton();

        // Create inventory panel (initially hidden)
        this.createInventoryPanel();

        // Create dialog system (initially hidden)
        this.createDialogSystem();
    }

    createScoreDisplay() {
        // Score background with Sierra-style border
        this.scoreBackground = this.scene.add.rectangle(100, 25, 180, 40, this.colors.background)
            .setScrollFactor(0)
            .setDepth(100);

        // Score border (double-line Sierra style)
        this.scoreBorderOuter = this.scene.add.rectangle(100, 25, 180, 40, this.colors.border)
            .setScrollFactor(0)
            .setDepth(99)
            .setStrokeStyle(2, this.colors.border);

        this.scoreBorderInner = this.scene.add.rectangle(100, 25, 176, 36, this.colors.background)
            .setScrollFactor(0)
            .setDepth(101)
            .setStrokeStyle(1, this.colors.text);

        // Score text
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
        // Inventory button background
        this.invButton = this.scene.add.rectangle(700, 25, 80, 30, this.colors.button)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, this.colors.border)
            .setInteractive({ cursor: 'pointer' });

        // Inventory button text
        this.invButtonText = this.scene.add.text(700, 25, 'PACK', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        // Button hover effects
        this.invButton.on('pointerover', () => {
            this.invButton.setFillStyle(this.colors.buttonHover);
        });

        this.invButton.on('pointerout', () => {
            this.invButton.setFillStyle(this.colors.button);
        });

        this.invButton.on('pointerdown', () => {
            this.toggleInventory();
        });
    }

    createInventoryPanel() {
        this.inventoryPanel = this.scene.add.group();

        // Main inventory background
        this.invBackground = this.scene.add.rectangle(400, 300, 400, 300, this.colors.background)
            .setScrollFactor(0)
            .setDepth(200)
            .setVisible(false);

        // Inventory border (Sierra double-line style)
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

        // Inventory title
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

        // Create inventory slots
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

        // Close button
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

        this.invCloseButton.on('pointerdown', () => {
            this.toggleInventory();
        });

        // Add all elements to inventory panel group
        this.inventoryPanel.addMultiple([
            this.invBackground, this.invBorderOuter, this.invBorderInner,
            this.invTitle, this.invCloseButton, this.invCloseText,
            ...this.inventorySlots
        ]);
    }

    createDialogSystem() {
        this.dialogPanel = this.scene.add.group();

        // EGA palette
        this.egaColors = {
            mediumGray: 0xAAAAAA,
            lightGray: 0xDDDDDD,
            darkGray: 0x555555,
            yellow: 0xAAAA00,
            black: 0x000000
        };

        // Dialog box dimensions
        const boxX = 400, boxY = 450, boxW = 600, boxH = 220;
    const thirdW = Math.floor(boxW / 3), twoThirdW = boxW - thirdW;
    const halfH = Math.floor(boxH / 2);

        // Main background (full dialog)
        this.dialogBackground = this.scene.add.rectangle(boxX, boxY, boxW, boxH, this.egaColors.mediumGray)
            .setScrollFactor(0).setDepth(300).setVisible(false);

        // Beveled edges (light top/left, dark bottom/right)
        this.dialogBevels = [];
        // Top bevel
        this.dialogBevels.push(this.scene.add.rectangle(boxX, boxY-boxH/2+4, boxW-8, 8, this.egaColors.lightGray)
            .setScrollFactor(0).setDepth(301).setVisible(false));
        // Left bevel
        this.dialogBevels.push(this.scene.add.rectangle(boxX-boxW/2+4, boxY, 8, boxH-8, this.egaColors.lightGray)
            .setScrollFactor(0).setDepth(301).setVisible(false));
        // Bottom bevel
        this.dialogBevels.push(this.scene.add.rectangle(boxX, boxY+boxH/2-4, boxW-8, 8, this.egaColors.darkGray)
            .setScrollFactor(0).setDepth(301).setVisible(false));
        // Right bevel
        this.dialogBevels.push(this.scene.add.rectangle(boxX+boxW/2-4, boxY, 8, boxH-8, this.egaColors.darkGray)
            .setScrollFactor(0).setDepth(301).setVisible(false));

        // Rectangle 1: Sprite (left 1/3, full height)
        this.dialogSpriteRect = this.scene.add.rectangle(boxX-boxW/2+thirdW/2, boxY, thirdW, boxH, this.egaColors.mediumGray)
            .setScrollFactor(0).setDepth(302).setVisible(false);
        this.dialogSprite = this.scene.add.sprite(boxX-boxW/2+thirdW/2, boxY, null)
            .setScrollFactor(0).setDepth(303).setVisible(false).setScale(3).setOrigin(0.5, 0.5);

        // Rectangle 2: Dialog text (right 2/3, top half)
        this.dialogTextRect = this.scene.add.rectangle(boxX-boxW/2+thirdW+twoThirdW/2, boxY-boxH/2+halfH/2, twoThirdW, halfH, this.egaColors.mediumGray)
            .setScrollFactor(0).setDepth(302).setVisible(false);
        this.dialogTextLines = [];
        for (let i = 0; i < 5; i++) {
            const line = this.scene.add.text(boxX-boxW/2+thirdW+24, boxY-boxH/2+24+i*26, '', {
                fontFamily: 'ByteBounce Medium, monospace',
                fontSize: '16px',
                fontStyle: 'bold',
                fill: '#FFFFFF',
                align: 'left',
                antialias: false,
                resolution: 2,
                wordWrap: { width: twoThirdW -48}
            })
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(303)
            .setVisible(false);
            this.dialogTextLines.push(line);
        }

        // Rectangle 3: Buttons (right 2/3, bottom half)
        this.dialogButtonRect = this.scene.add.rectangle(boxX-boxW/2+thirdW+twoThirdW/2, boxY-boxH/2+halfH+halfH/2, twoThirdW, halfH, this.egaColors.mediumGray)
            .setScrollFactor(0).setDepth(302).setVisible(false);
        this.responseButtons = [];
        this.responseTexts = [];
    const buttonHeight = Math.round(28 * 1.25);
        for (let i = 0; i < 4; i++) {
            const btnY = boxY-boxH/2+halfH+4+i*buttonHeight;
            const button = this.scene.add.rectangle(boxX-boxW/2+thirdW+twoThirdW/2, btnY, twoThirdW-32, buttonHeight, this.egaColors.darkGray)
                .setScrollFactor(0).setDepth(304).setStrokeStyle(2, this.egaColors.lightGray)
                .setVisible(false).setInteractive({ cursor: 'pointer' });
            const text = this.scene.add.text(boxX-boxW/2+thirdW+twoThirdW/2, btnY, '', {
                fontFamily: 'ByteBounce Medium, monospace',
                fontSize: '14px',
                fontStyle: 'bold',
                fill: '#FFFFFF',
                align: 'center',
                resolution: 2,
                wordWrap: { width: twoThirdW-48 }
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(305)
            .setVisible(false);
            button.responseIndex = i;
            button.on('pointerover', () => {
                button.setFillStyle(this.egaColors.mediumGray);
            });
            button.on('pointerout', () => {
                button.setFillStyle(this.egaColors.darkGray);
            });
            this.responseButtons.push(button);
            this.responseTexts.push(text);
        }
        this.dialogPanel.addMultiple([
            this.dialogBackground,
            ...this.dialogBevels,
            this.dialogSpriteRect,
            this.dialogTextRect,
            this.dialogButtonRect,
            this.dialogSprite,
            ...this.dialogTextLines,
            ...this.responseButtons,
            ...this.responseTexts
        ]);
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
                // Item exists - could add item sprites here
                slot.setFillStyle(this.colors.button);
            } else {
                // Empty slot
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

    // Score Management
    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
    }

    getScore() {
        return this.score;
    }

    // Dialog System
    showDialog(vendorData) {
        if (this.isDialogOpen) return;
        this.isDialogOpen = true;
        this.currentDialog = vendorData;
        // Show dialog panel
        this.dialogPanel.getChildren().forEach(child => {
            child.setVisible(true);
        });
        // Set dialog text (let wordWrap handle line breaks)
        let dialogText = vendorData.dialog.greeting || '';
        this.dialogTextLines[0].setText(dialogText);
        this.dialogTextLines[0].setVisible(true);
        for (let i = 1; i < this.dialogTextLines.length; i++) {
            this.dialogTextLines[i].setText('');
            this.dialogTextLines[i].setVisible(false);
        }
        // Overlay NPC sprite (left column)
        let spriteKey = vendorData.spriteKey || vendorData.npcSpriteKey;
        let spriteFrame = vendorData.spriteFrame || vendorData.npcSpriteFrame || 0;
        if (spriteKey) {
            this.dialogSprite.setTexture(spriteKey);
            this.dialogSprite.setFrame(spriteFrame);
            this.dialogSprite.setVisible(true);
            this.dialogSprite.setScale(3);
        } else {
            this.dialogSprite.setVisible(false);
        }
        // Setup response buttons (vertical stack)
        vendorData.dialog.responses.forEach((response, index) => {
            if (index < this.responseButtons.length) {
                this.responseButtons[index].setVisible(true);
                this.responseTexts[index].setVisible(true);
                this.responseTexts[index].setText(response.text.toUpperCase());
                this.responseButtons[index].removeAllListeners('pointerdown');
                this.responseButtons[index].on('pointerdown', () => {
                    this.handleDialogResponse(response.action);
                });
            }
        });
        // Hide unused buttons
        for (let i = vendorData.dialog.responses.length; i < this.responseButtons.length; i++) {
            this.responseButtons[i].setVisible(false);
            this.responseTexts[i].setVisible(false);
        }
    }

    handleDialogResponse(action) {
        switch (action) {
            case 'show_items':
                this.showVendorItems();
                break;
            case 'booth_info':
                this.showBoothInfo();
                break;
            case 'end':
                this.closeDialog();
                break;
        }
    }

    showVendorItems() {
        if (!this.currentDialog) return;

        let itemText = "Available Items:\n\n";
        this.currentDialog.items.forEach(item => {
            itemText += `${item.name} - ${item.value} pts\n${item.description}\n\n`;
        });

        this.dialogText.setText(itemText);
        this.setupDialogCloseButton();
    }

    showBoothInfo() {
        if (!this.currentDialog) return;

        this.dialogText.setText(this.currentDialog.description);
        this.setupDialogCloseButton();
    }

    setupDialogCloseButton() {
        // Hide all response buttons except first one as "OK"
        this.responseButtons.forEach((button, index) => {
            button.setVisible(index === 0);
            if (index === 0) {
                this.responseTexts[index].setText('OK');
                button.removeAllListeners('pointerdown');
                button.on('pointerdown', () => {
                    this.closeDialog();
                });
            } else {
                this.responseTexts[index].setVisible(false);
            }
        });
    }

    closeDialog() {
        this.isDialogOpen = false;
        this.currentDialog = null;

        this.dialogPanel.getChildren().forEach(child => {
            child.setVisible(false);
        });
    }

    // Input handling for UI
    handleInput(key) {
        if (key === 'I' || key === 'i') {
            this.toggleInventory();
        } else if (key === 'ESCAPE') {
            if (this.isDialogOpen) {
                this.closeDialog();
            } else if (this.isInventoryOpen) {
                this.toggleInventory();
            }
        }
    }
}

export default UIManager;