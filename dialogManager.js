class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.buttonElements = null;
    }

    showDialog({ imageKey, title = '', text = '', buttons = [], exitButton = null, pagination = null, bottomButtons = null }) {
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
            x: -dialogWidth / 4,  // Start at left edge of right 3/4 section
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
        const dialogText = this.scene.add.text(rightColumn.x, rightColumn.y, text, {
            fontSize: '18px',
            wordWrap: { width: rightColumn.width },
            color: '#000',  // Black for visibility
            align: 'left'
        }).setOrigin(0.0);

        console.log(dialogText.text, `Dialog text dimensions: ${dialogText.width}x${dialogText.height}, pos: ${dialogText.x}x${dialogText.y}`);
        // Handle pagination
        let displayButtons = buttons;
        if (pagination) {
            console.log('Applying pagination:', pagination, 'to buttons:', buttons.length);
            const { currentPage, totalPages, itemsPerPage } = pagination;
            const startIndex = currentPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, buttons.length);
            displayButtons = buttons.slice(startIndex, endIndex);
            console.log('Sliced to displayButtons:', displayButtons.length);

            // Add pagination controls if needed
            if (totalPages > 1) {
                const paginationButtons = [];

                if (currentPage > 0) {
                    paginationButtons.push({
                        label: 'Previous',
                        onClick: () => {
                            console.log('Previous clicked, calling onPageChange');
                            if (pagination.onPageChange) {
                                pagination.onPageChange(currentPage - 1);
                            }
                        }
                    });
                }

                if (currentPage < totalPages - 1) {
                    paginationButtons.push({
                        label: 'Next',
                        onClick: () => {
                            console.log('Next clicked, calling onPageChange');
                            if (pagination.onPageChange) {
                                pagination.onPageChange(currentPage + 1);
                            }
                        }
                    });
                }

                displayButtons = displayButtons.concat(paginationButtons);
                console.log('Added pagination buttons, total displayButtons:', displayButtons.length);
            }
        }

        // Buttons: stack vertically in right bottom column, positioned based on button count
        const buttonSpacing = 38;
        const maxButtonsInArea = Math.floor((rightBotColumn.height - 16) / buttonSpacing); // Available button slots

        // Position buttons from bottom up for fewer buttons, or from top down for many buttons
        let buttonYStart;
        if (displayButtons.length <= 3) {
            // For few buttons, position higher up to avoid exit button
            buttonYStart = rightBotColumn.y + rightBotColumn.height - 8 - (displayButtons.length * buttonSpacing) - 40; // Leave space for exit button
        } else {
            // For many buttons, start higher up and fill the area - move up by button height
            buttonYStart = rightBotColumn.y + 8 - dialogHeight / 8 - 38; // Move up by one button height
        }

        let buttonObjs = [];

        displayButtons.forEach((btn, i) => {
            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'left'
            });
            const textWidth = btnText.width;
            const buttonWidth = Math.max(100, textWidth + 20);
            const buttonX = this.dialogContainer.x + rightBotColumn.x + 8;  // Absolute position
            const buttonY = this.dialogContainer.y + buttonYStart + i * buttonSpacing;  // Absolute position

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

        // Render exit button at the bottom right corner
        if (exitButton) {
            console.log('Rendering exit button');
            const exitBtnText = this.scene.add.text(0, 0, exitButton.label, {
                fontSize: '16px',
                color: '#fff',
                align: 'left'
            });
            const exitTextWidth = exitBtnText.width;
            const exitButtonWidth = Math.max(100, exitTextWidth + 20);
            // Position at bottom right corner
            const exitButtonX = this.dialogContainer.x + dialogWidth / 2 - exitButtonWidth - 8;  // Right aligned
            const exitButtonY = this.dialogContainer.y + dialogHeight / 2 - 8 - 30;  // Absolute position

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

            exitBtnText.setPosition(exitButtonX + exitButtonWidth / 2, exitButtonY + 15);  // Center aligned within button
            exitBtnText.setOrigin(0.5, 0.5);
            exitBtnText.setDepth(2002);

            buttonObjs.push(exitBtnBg, exitBtnText);
        }

        // Render bottom buttons horizontally across the bottom
        if (bottomButtons && bottomButtons.length > 0) {
            console.log('Rendering bottom buttons:', bottomButtons.length);
            const bottomButtonY = this.dialogContainer.y + dialogHeight / 2 - 8 - 30;  // Same Y as exit button
            const totalButtonWidth = bottomButtons.reduce((total, btn) => {
                const btnText = this.scene.add.text(0, 0, btn.label, { fontSize: '16px' });
                const width = Math.max(60, btnText.width + 20); // Minimum width for arrow buttons
                btnText.destroy(); // Clean up temp text
                return total + width + 8; // Add spacing
            }, 0) - 8; // Remove last spacing

            const startX = this.dialogContainer.x - totalButtonWidth / 2; // Center the button group

            bottomButtons.forEach((btn, i) => {
                const isDisabled = btn.disabled || false;
                const buttonColor = isDisabled ? 0x222222 : 0x444444; // Darker gray for disabled
                const hoverColor = isDisabled ? 0x222222 : 0x666666; // No hover effect for disabled
                const textColor = isDisabled ? '#666666' : '#fff'; // Gray text for disabled

                const btnText = this.scene.add.text(0, 0, btn.label, {
                    fontSize: '16px',
                    color: textColor,
                    align: 'center'
                });
                const buttonWidth = Math.max(60, btnText.width + 20);
                const buttonX = startX + (i * (buttonWidth + 8));

                const btnBg = this.scene.add.rectangle(buttonX, bottomButtonY, buttonWidth, 30, buttonColor)
                    .setOrigin(0, 0)
                    .setDepth(2001);

                // Only make interactive and add hover effects if not disabled
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

                buttonObjs.push(btnBg, btnText);
            });
        }

        // Add all to container (except buttons which are positioned absolutely)
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