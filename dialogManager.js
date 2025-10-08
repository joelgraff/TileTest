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
        const dialogWidth = Math.min(600, cam.width * 0.85);
        const dialogHeight = Math.min(240, cam.height * 0.45);

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
            height: dialogHeight / 2,
        };

        const rightBotColumn = { 
            x: 8 - dialogWidth / 4,
            y: 16 - dialogHeight / 2,
            width: dialogWidth * 3 / 4, 
            height: 3 * dialogHeight / 4,
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

        // Buttons (lower right, stacked)
        const buttonYStart = rightBotColumn.height/4;
        const buttonSpacing = 38;
        const buttonObjs = buttons.slice(0, 3).map((btn, i) => {
            const btnObj = this.scene.add.text(rightBotColumn.x, buttonYStart - i * buttonSpacing, btn.label, {
                fontSize: '16px',
                backgroundColor: '#444',
                color: '#fff',
                padding: { x: 14, y: 7 }
            })
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                btn.onClick();
                this.dialogContainer.destroy();
            });
            return btnObj;
        });

        // Add all to container
        this.dialogContainer.add([bg, npcImage, dialogText, ...buttonObjs]);
        this.dialogContainer.setDepth(1000); // On top
    }

    hideDialog() {
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }
    }
}

export default DialogManager;