class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.buttonElements = null;
        // Cache mobile detection for performance
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    showDialog({ imageKey, title = '', text = '', buttons = [], exitButton = null, pagination = null, bottomButtons = null, textPagination = null }) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;
        const cam = this.scene.cameras.main;
        const dialogWidth = Math.min(this.isMobile ? 400 : 600, cam.width * (this.isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(this.isMobile ? 260 : 340, cam.height * (this.isMobile ? 0.8 : 0.65)); // Taller dialog

        this.createOverlay(cam);
        this.createDialogContainer(cam, dialogWidth, dialogHeight);
        this.renderBackground(dialogWidth, dialogHeight);
        this.renderTitleBar(dialogWidth, dialogHeight, title);
        const npcImage = this.renderNpcImage(imageKey, dialogWidth, dialogHeight);
        const displayText = this.handleTextPagination(text, textPagination);
        this.renderDialogText(displayText, dialogWidth, dialogHeight);
        const displayButtons = this.handleButtonPagination(buttons, pagination, textPagination);
        this.renderButtons(displayButtons, dialogWidth, dialogHeight);
        this.renderExitButton(exitButton, dialogWidth, dialogHeight);
        this.renderBottomButtons(bottomButtons, dialogWidth, dialogHeight);
        this.addToContainer(npcImage);
    }

    createOverlay(cam) {
        this.overlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(1999)
            .on('pointerdown', () => this.hideDialog());
    }

    createDialogContainer(cam, dialogWidth, dialogHeight) {
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height - dialogHeight / 2 - 16);
    }

    renderBackground(dialogWidth, dialogHeight) {
        const bg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x808080, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222)
            .setInteractive()
            .on('pointerdown', (pointer, localX, localY, event) => event.stopPropagation());
        this.dialogContainer.add(bg);
    }

    renderTitleBar(dialogWidth, dialogHeight, title) {
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
        this.dialogContainer.add([titleBar, titleText]);
    }

    renderNpcImage(imageKey, dialogWidth, dialogHeight) {
        if (!imageKey) return null;
        const leftTopColumn = {
            x: 32 - dialogWidth / 2,
            y: 40 + 16 - dialogHeight / 2,
            width: dialogWidth / 4,
            height: dialogHeight / 2,
        };
        const npcImage = this.scene.add.image(leftTopColumn.x, leftTopColumn.y, imageKey)
            .setDisplaySize(leftTopColumn.width / 2, leftTopColumn.height / 2)
            .setOrigin(0.0);
        return npcImage;
    }

    handleTextPagination(text, textPagination) {
        let displayText = text;
        if (textPagination && Array.isArray(text)) {
            const { currentPage = 0, itemsPerPage = 5 } = textPagination;
            const startIndex = currentPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, text.length);
            const pageItems = text.slice(startIndex, endIndex);
            displayText = pageItems.join('\n');
        }
        return displayText;
    }

    renderDialogText(displayText, dialogWidth, dialogHeight) {
        const rightColumn = {
            x: -dialogWidth / 4,
            y: 40 + 16 - dialogHeight / 2,
            width: dialogWidth * 3 / 4 - 8,
        };
        const dialogText = this.scene.add.text(rightColumn.x, rightColumn.y, displayText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: rightColumn.width },
            color: '#000',
            align: 'left'
        }).setOrigin(0.0);
        this.dialogContainer.add(dialogText);
    }

    handleButtonPagination(buttons, pagination, textPagination) {
        let displayButtons = buttons.concat(this.getTextPaginationButtons(textPagination));
        if (pagination) {
            const { currentPage, totalPages, itemsPerPage } = pagination;
            const startIndex = currentPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, buttons.length);
            displayButtons = buttons.slice(startIndex, endIndex).concat(this.getTextPaginationButtons(textPagination));
            displayButtons = displayButtons.concat(this.getPaginationButtons(pagination));
        }
        return displayButtons;
    }

    getTextPaginationButtons(textPagination) {
        const buttons = [];
        if (textPagination && Array.isArray(textPagination.text)) {
            const { currentPage = 0, itemsPerPage = 5, text } = textPagination;
            const totalPages = Math.ceil(text.length / itemsPerPage);
            if (totalPages > 1) {
                if (currentPage > 0) {
                    buttons.push({
                        label: '<',
                        onClick: () => this.showDialog({ ...this.getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage - 1 } })
                    });
                }
                if (currentPage < totalPages - 1) {
                    buttons.push({
                        label: '>',
                        onClick: () => this.showDialog({ ...this.getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage + 1 } })
                    });
                }
            }
        }
        return buttons;
    }

    getPaginationButtons(pagination) {
        const buttons = [];
        const { currentPage, totalPages } = pagination;
        if (totalPages > 1) {
            if (currentPage > 0) {
                buttons.push({
                    label: 'Previous',
                    onClick: () => {
                        if (pagination.onPageChange) pagination.onPageChange(currentPage - 1);
                    }
                });
            }
            if (currentPage < totalPages - 1) {
                buttons.push({
                    label: 'Next',
                    onClick: () => {
                        if (pagination.onPageChange) pagination.onPageChange(currentPage + 1);
                    }
                });
            }
        }
        return buttons;
    }

    renderButtons(displayButtons, dialogWidth, dialogHeight) {
        const buttonSpacing = 38;
        const rightBotColumn = {
            x: -dialogWidth / 4,
            y: (40 + 16 - dialogHeight / 2) + (dialogHeight - 40 - 32) / 2,
            width: dialogWidth * 3 / 4 - 8,
            height: (dialogHeight - 40 - 32) / 2,
        };
        let buttonYStart;
        if (displayButtons.length <= 3) {
            buttonYStart = rightBotColumn.y + rightBotColumn.height - 8 - (displayButtons.length * buttonSpacing) - 40;
        } else {
            buttonYStart = rightBotColumn.y + 8 - dialogHeight / 8 - 38;
        }

        let buttonObjs = [];
        displayButtons.forEach((btn, i) => {
            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                fontStyle: 'bold',
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

            btnText.setPosition(buttonX + 10, buttonY + 15);
            btnText.setOrigin(0, 0.5);
            btnText.setDepth(2002);

            buttonObjs.push(btnBg, btnText);
        });
        this.buttonElements = buttonObjs;
    }

    renderExitButton(exitButton, dialogWidth, dialogHeight) {
        if (!exitButton) return;
        const exitBtnText = this.scene.add.text(0, 0, exitButton.label, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'left'
        });
        const exitTextWidth = exitBtnText.width;
        const exitButtonWidth = Math.max(100, exitTextWidth + 20);
        const exitButtonX = this.dialogContainer.x + dialogWidth / 2 - exitButtonWidth - 8;
        const exitButtonY = this.dialogContainer.y + dialogHeight / 2 - 8 - 30;

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

        exitBtnText.setPosition(exitButtonX + exitButtonWidth / 2, exitButtonY + 15);
        exitBtnText.setOrigin(0.5, 0.5);
        exitBtnText.setDepth(2002);

        this.buttonElements.push(exitBtnBg, exitBtnText);
    }

    renderBottomButtons(bottomButtons, dialogWidth, dialogHeight) {
        if (!bottomButtons || bottomButtons.length === 0) return;
        const bottomButtonY = this.dialogContainer.y + dialogHeight / 2 - 8 - 30;
        const buttonWidth = 60;
        const totalButtonWidth = bottomButtons.length * buttonWidth + (bottomButtons.length - 1) * 8;
        const startX = this.dialogContainer.x - totalButtonWidth / 2;

        bottomButtons.forEach((btn, i) => {
            const isDisabled = btn.disabled || false;
            const buttonColor = isDisabled ? 0x222222 : 0x444444;
            const hoverColor = isDisabled ? 0x222222 : 0x666666;
            const textColor = isDisabled ? '#666666' : '#fff';

            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                fontStyle: 'bold',
                color: textColor,
                align: 'center'
            });
            const buttonX = startX + (i * (buttonWidth + 8));

            const btnBg = this.scene.add.rectangle(buttonX, bottomButtonY, buttonWidth, 30, buttonColor)
                .setOrigin(0, 0)
                .setDepth(2001);

            if (!isDisabled) {
                btnBg.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => btnBg.setFillStyle(hoverColor))
                    .on('pointerout', () => btnBg.setFillStyle(buttonColor))
                    .on('pointerdown', (pointer, localX, localY, event) => {
                        event.stopPropagation();
                        btn.onClick();
                    });
            }

            btnText.setPosition(buttonX + buttonWidth / 2, bottomButtonY + 15);
            btnText.setOrigin(0.5, 0.5);
            btnText.setDepth(2002);

            this.buttonElements.push(btnBg, btnText);
        });
    }

    addToContainer(npcImage) {
        const containerItems = [];
        if (npcImage) containerItems.push(npcImage);
        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000);
    }

    getDialogParams() {
        // Helper to reconstruct params for pagination (simplified; adjust as needed)
        return {}; // Placeholder; implement based on stored params if required
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