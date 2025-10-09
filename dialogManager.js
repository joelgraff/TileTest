class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.buttonElements = null;
    }

    showDialog({ imageKey, text, buttons = [] }) { // Default buttons to []
        // If dialog is already open, close it first
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        // Set dialog open flag to pause game logic
        this.scene.isDialogOpen = true;

        this.isDialogOpen = true;

        const cam = this.scene.cameras.main;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const dialogWidth = Math.min(isMobile ? 400 : 600, cam.width * (isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(isMobile ? 160 : 240, cam.height * (isMobile ? 0.6 : 0.45));

        // Create overlay for click-outside-to-close functionality
        this.overlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(1999)
            .on('pointerdown', () => {
                this.hideDialog();
            });

        // Main container centered near bottom
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height - dialogHeight / 2 - 16);

        const leftTopColumn = {
            x: 32 - dialogWidth / 2,
            y: 16 - dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight / 2,
        };

        const leftBotColumn = {
            x: 32 - dialogWidth / 2,
            y: 16 - dialogHeight / 2 + dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight / 2,
        };

        const rightColumn = {
            x: 8 - dialogWidth / 4,
            y: 16 - dialogHeight / 2,
            width: dialogWidth * 3 / 4 - 8,
            height: dialogHeight - 32,
        };

        // Background
        const bg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x808080, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222)
            .setInteractive()
            .on('pointerdown', (pointer, localX, localY, event) => {
                // Stop event propagation to prevent overlay click
                event.stopPropagation();
            });

        let npcImage = null;
        // Image (left top) - only if imageKey is provided
        if (imageKey) {
            const imgSize = leftTopColumn.width;
            npcImage = this.scene.add.image(leftTopColumn.x, leftTopColumn.y, imageKey)
                .setDisplaySize(leftTopColumn.width / 2, leftTopColumn.height / 2)
                .setOrigin(0.0);
        }

        // Dialog text (right side)
        const dialogText = this.scene.add.text(rightColumn.x, rightColumn.y, text, {
            fontSize: '18px',
            wordWrap: { width: rightColumn.width },
            color: '#fff',
            align: 'left'
        }).setOrigin(0.0);

        // Buttons: stack non-leave buttons in left bottom column, place leave button at bottom right
        const buttonYStart = leftBotColumn.y;
        const buttonSpacing = 38;
        let buttonObjs = [];

        // Stack the first buttons (except last) in rightBotColumn
        const stackedButtons = buttons.slice(0, buttons.length - 1);
        stackedButtons.forEach((btn, i) => {
            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'center'
            });
            const textWidth = btnText.width;
            const buttonWidth = Math.max(100, textWidth + 20);
            const buttonX = this.dialogContainer.x + leftBotColumn.x + (leftBotColumn.width - buttonWidth) / 2;
            const buttonY = this.dialogContainer.y + buttonYStart + i * buttonSpacing;

            const btnBg = this.scene.add.rectangle(buttonX, buttonY, buttonWidth, 30, 0x444444)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(2001)
                .on('pointerover', () => btnBg.setFillStyle(0x666666))
                .on('pointerout', () => btnBg.setFillStyle(0x444444))
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    btn.onClick();
                });

            btnText.setPosition(buttonX + buttonWidth / 2, buttonY + 15);
            btnText.setOrigin(0.5, 0.5);
            btnText.setDepth(2002);

            buttonObjs.push(btnBg, btnText);
        });

        // Place the last button (Leave) at bottom right
        if (buttons.length > 0) {
            const leaveBtn = buttons[buttons.length - 1];
            const leaveText = this.scene.add.text(0, 0, leaveBtn.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'center'
            });
            const leaveTextWidth = leaveText.width;
            const leaveButtonWidth = Math.max(100, leaveTextWidth + 20);
            const leaveButtonX = this.dialogContainer.x + dialogWidth / 2 - leaveButtonWidth - 10;
            const leaveButtonY = this.dialogContainer.y + dialogHeight / 2 - 40;

            const leaveBg = this.scene.add.rectangle(leaveButtonX, leaveButtonY, leaveButtonWidth, 30, 0x444444)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(2001)
                .on('pointerover', () => leaveBg.setFillStyle(0x666666))
                .on('pointerout', () => leaveBg.setFillStyle(0x444444))
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    leaveBtn.onClick();
                });

            leaveText.setPosition(leaveButtonX + leaveButtonWidth / 2, leaveButtonY + 15);
            leaveText.setOrigin(0.5, 0.5);
            leaveText.setDepth(2002);

            buttonObjs.push(leaveBg, leaveText);
        }

        // Add all to container (except buttons which are added to scene)
        const containerItems = [bg, dialogText];
        if (npcImage) {
            containerItems.splice(1, 0, npcImage); // Insert image after background
        }
        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000); // On top

        // Store button references for cleanup
        this.buttonElements = buttonObjs;
    }

    hideDialog() {
        if (this.isDialogOpen) {
            // Resume game logic
            this.scene.isDialogOpen = false;
            this.isDialogOpen = false;
        }

        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        // Clean up button elements that were added directly to scene
        if (this.buttonElements) {
            this.buttonElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.buttonElements = null;
        }
    }
}

export default DialogManager;