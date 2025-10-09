class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
    }

    showDialog({ imageKey, text, buttons = [] }) { // Default buttons to []
        // Remove previous dialog if exists
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
        }

        const cam = this.scene.cameras.main;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const dialogWidth = Math.min(isMobile ? 400 : 600, cam.width * (isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(isMobile ? 160 : 240, cam.height * (isMobile ? 0.6 : 0.45));

        // Main container centered near bottom
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height - dialogHeight / 2 - 16);

        const leftColumn = {
            x: 32 -dialogWidth / 2,
            y: -dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight,
        };

        const rightTopColumn = {
            x: 8 - dialogWidth / 4,
            y: 16 - dialogHeight / 2,
            width: -8 + (dialogWidth * 3 / 4),
            height: dialogHeight / 3,
        };

        const rightBotColumn = {
            x: 8 - dialogWidth / 4,
            y: -dialogHeight / 8,
            width: dialogWidth * 3 / 4,
            height: 2 * dialogHeight / 3,
        };

        // Background
        const bg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x808080, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222);

        // Image (left side)
        const imgSize = leftColumn.width;
        const npcImage =
            this.scene.add.image(leftColumn.x, leftColumn.y, imageKey)
            .setDisplaySize(leftColumn.width / 2, leftColumn.height / 2)
            .setOrigin(0.0);

        // Dialog text (upper right)
        const textWidth = rightTopColumn.width;
        const dialogText = this.scene.add.text(rightTopColumn.x, rightTopColumn.y, text, {
            fontSize: '18px',
            wordWrap: { width: textWidth },
            color: '#fff',
            align: 'left'
        }).setOrigin(0.0);

        // Buttons: stack non-leave buttons in right column, place leave button at bottom right
        const buttonYStart = rightBotColumn.y;
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
            const buttonX = rightBotColumn.x // + (rightBotColumn.width - buttonWidth) / 2;

            const btnBg = this.scene.add.rectangle(buttonX, buttonYStart + i * buttonSpacing, buttonWidth, 30, 0x444444)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => btnBg.setFillStyle(0x666666))
                .on('pointerout', () => btnBg.setFillStyle(0x444444))
                .on('pointerdown', () => {
                    btn.onClick();
                });

            btnText.setPosition(buttonX + buttonWidth / 2, buttonYStart + i * buttonSpacing + 15);
            btnText.setOrigin(0.5, 0.5);

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
            const leaveButtonX = dialogWidth / 2 - leaveButtonWidth - 10;
            const leaveButtonY = dialogHeight / 2 - 40;

            const leaveBg = this.scene.add.rectangle(leaveButtonX, leaveButtonY, leaveButtonWidth, 30, 0x444444)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => leaveBg.setFillStyle(0x666666))
                .on('pointerout', () => leaveBg.setFillStyle(0x444444))
                .on('pointerdown', () => {
                    leaveBtn.onClick();
                });

            leaveText.setPosition(leaveButtonX + leaveButtonWidth / 2, leaveButtonY + 15);
            leaveText.setOrigin(0.5, 0.5);

            buttonObjs.push(leaveBg, leaveText);
        }

        // Add all to container
        this.dialogContainer.add([bg, npcImage, dialogText, ...buttonObjs]);
        this.dialogContainer.setDepth(2000); // On top
    }

    hideDialog() {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }
    }
}

export default DialogManager;