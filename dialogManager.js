class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.buttonElements = null;
    }

    showDialog({ imageKey, title = '', text = '', buttons = [], exitButton = null }) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;
        console.log('Showing dialog:', imageKey, title, text, buttons, exitButton);
        const cam = this.scene.cameras.main;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const dialogWidth = Math.min(isMobile ? 400 : 600, cam.width * (isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(isMobile ? 260 : 340, cam.height * (isMobile ? 0.8 : 0.65)); // Taller dialog

        // Overlay for click-outside-to-close
        this.overlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(1999)
            .on('pointerdown', () => {
                this.hideDialog();
            });

        // Main container centered near bottom
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height - dialogHeight / 2 - 16);

        // Title bar
        const titleBarHeight = 40;
        const titleBar = this.scene.add.rectangle(0, -dialogHeight / 2 + titleBarHeight / 2, dialogWidth, titleBarHeight, 0x333366, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222);

        const titleText = this.scene.add.text(0, -dialogHeight / 2 + titleBarHeight / 2, title || '', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center',
            wordWrap: { width: dialogWidth - 32 }
        }).setOrigin(0.5);

        // Layout columns (relative to container origin)
        const leftTopColumn = {
            x: 32 - dialogWidth / 2,
            y: titleBarHeight + 16 - dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight / 2,
        };

        const rightColumn = {
            x: dialogWidth / 4,  // Relative to container center
            y: titleBarHeight + 16 - dialogHeight / 2,  // Relative to container center
            width: dialogWidth * 3 / 4 - 8,
            height: dialogHeight - titleBarHeight - 32,
        };

        const rightBotColumn = {
            x: rightColumn.x,  // Relative to container center
            y: rightColumn.y + rightColumn.height / 2,  // Relative to container center
            width: rightColumn.width,
            height: rightColumn.height / 2,
        };


        // Background
        const bg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x808080, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222)
            .setInteractive()
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
            });

        let npcImage = null;
        if (imageKey) {
            npcImage = this.scene.add.image(leftTopColumn.x, leftTopColumn.y, imageKey)
                .setDisplaySize(leftTopColumn.width / 2, leftTopColumn.height / 2)
                .setOrigin(0.0);
        }

        // Dialog text (right side, relative to container)
        const dialogText = this.scene.add.text(rightColumn.x, rightColumn.y + 100, text, {
            fontSize: '18px',
            wordWrap: { width: rightColumn.width },
            color: '#000',  // Black for visibility
            align: 'left'
        }).setOrigin(0.0);

        console.log(dialogText.text, `Dialog text dimensions: ${dialogText.width}x${dialogText.height}, pos: ${dialogText.x}x${dialogText.y}`);
        // Buttons: stack vertically in right bottom column, left aligned, shifted upward by 1/8 dialog height
        const buttonYStart = rightBotColumn.y + 8 - dialogHeight / 8;  // Shift stack upward by 1/8 height
        const buttonSpacing = 38;
        let buttonObjs = [];

        buttons.forEach((btn, i) => {
            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'left'
            });
            const textWidth = btnText.width;
            const buttonWidth = Math.max(100, textWidth + 20);
            const buttonX = rightBotColumn.x + 8;  // Relative to container center
            const buttonY = buttonYStart + i * buttonSpacing;  // Relative to container center

            console.log(`Rendering button ${btn.label} at (${buttonX}, ${buttonY})`);

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

            btnText.setPosition(buttonX + 10, buttonY + 15);
            btnText.setOrigin(0, 0.5);
            btnText.setDepth(2002);

            buttonObjs.push(btnBg, btnText);
        });

        // Render exit button at the bottom with small margin above lower border
        if (exitButton) {
            console.log('Rendering exit button');
            const exitBtnText = this.scene.add.text(0, 0, exitButton.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'left'
            });
            const exitTextWidth = exitBtnText.width;
            const exitButtonWidth = Math.max(100, exitTextWidth + 20);
            const exitButtonX = rightBotColumn.x + 8;  // Relative to container center
            const exitButtonY = dialogHeight / 2 - 8 - 30;  // Bottom with 8px margin above border, relative to container center

            const exitBtnBg = this.scene.add.rectangle(exitButtonX, exitButtonY, exitButtonWidth, 30, 0x444444)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(2001)
                .on('pointerover', () => exitBtnBg.setFillStyle(0x666666))
                .on('pointerout', () => exitBtnBg.setFillStyle(0x444444))
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    exitButton.onClick();
                });

            exitBtnText.setPosition(exitButtonX + 10, exitButtonY + 15);  // Left aligned
            exitBtnText.setOrigin(0, 0.5);
            exitBtnText.setDepth(2002);

            buttonObjs.push(exitBtnBg, exitBtnText);
        }

        // Add all to container
        const containerItems = [bg, titleBar, titleText, dialogText, ...buttonObjs];
        if (npcImage) {
            containerItems.splice(3, 0, npcImage);
        }
        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000);

        // Store button references for cleanup (no longer needed since added to container)
        this.buttonElements = null;

    }
    hideDialog() {
        if (this.isDialogOpen) {
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