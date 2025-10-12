class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.buttonElements = null;
    }

    showDialog({ imageKey, title, text, buttons = [] }) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;
console.log('Showing dialog:', { imageKey, title, text, buttons });
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

        // Layout columns
        const leftTopColumn = {
            x: 32 - dialogWidth / 2,
            y: titleBarHeight + 16 - dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight / 2,
        };

        const rightColumn = {
            x: 8 - dialogWidth / 4,
            y: titleBarHeight + 16 - dialogHeight / 2,
            width: dialogWidth * 3 / 4 - 8,
            height: dialogHeight - titleBarHeight - 32,
        };

        const rightBotColumn = {
            x: rightColumn.x,
            y: rightColumn.y + rightColumn.height / 2,
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

        // Dialog text (right side)
        const dialogText = this.scene.add.text(rightColumn.x, rightColumn.y, text, {
            fontSize: '18px',
            wordWrap: { width: rightColumn.width },
            color: '#fff',
            align: 'left'
        }).setOrigin(0.0);

        // Buttons: stack vertically in right bottom column, left aligned
        const buttonYStart = rightBotColumn.y + 8;
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
            const buttonX = this.dialogContainer.x + rightBotColumn.x + 8;
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

            btnText.setPosition(buttonX + 10, buttonY + 15); // Left aligned
            btnText.setOrigin(0, 0.5);
            btnText.setDepth(2002);

            buttonObjs.push(btnBg, btnText);
        });

        // Add all to container (except buttons which are added to scene)
        const containerItems = [bg, titleBar, titleText, dialogText];
        if (npcImage) {
            containerItems.splice(3, 0, npcImage);
        }
        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000);

        // Store button references for cleanup
        this.buttonElements = buttonObjs;
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