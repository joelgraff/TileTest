import DialogLayout from './ui/DialogLayout.js';

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
        console.log('showDialog called with:', { imageKey, title, text: text?.substring(0, 50), buttons: buttons?.length, exitButton, pagination, bottomButtons, textPagination });

        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;
        const cam = this.scene.cameras.main;
        console.log('Camera:', cam, 'width:', cam?.width, 'height:', cam?.height);

        const dialogWidth = Math.min(this.isMobile ? 400 : 600, cam.width * (this.isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(this.isMobile ? 260 : 340, cam.height * (this.isMobile ? 0.8 : 0.65));
        console.log('Calculated dimensions:', dialogWidth, dialogHeight);

        this.createOverlay(cam);
        this.createDialogContainer(cam, dialogWidth, dialogHeight);

        // Initialize the layout system
        this.dialogLayout = new DialogLayout(this.scene, cam.width / 2, cam.height - dialogHeight / 2 - 16, dialogWidth, dialogHeight);

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
        // Create title bar background
        const titleBar = this.scene.add.rectangle(
            0,
            -dialogHeight / 2 + 20, // Center of title bar area
            dialogWidth,
            40,
            0x333366,
            1
        ).setOrigin(0.5).setStrokeStyle(2, 0x222222);

        const titleText = this.scene.add.text(0, -dialogHeight / 2 + 20, title || 'Dialog', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center',
            wordWrap: { width: dialogWidth - 32 }
        }).setOrigin(0.5);

        console.log('Setting dialog title:', title, titleText);
        this.dialogLayout.setTitle(titleText);

        // Add title bar background to layout elements
        this.dialogLayout.elements.titleBar = titleBar;
    }

    renderNpcImage(imageKey, dialogWidth, dialogHeight) {
        if (!imageKey) return null;
        const npcImage = this.scene.add.image(0, 0, imageKey)
            .setDisplaySize(dialogWidth / 6, dialogWidth / 6) // Square aspect ratio, smaller size
            .setOrigin(0.5, 0.5);
        this.dialogLayout.setImage(npcImage);
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
        console.log('Rendering dialog text:', displayText);
        const dialogText = this.scene.add.text(0, 0, displayText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: 2 * dialogWidth / 3 - 16 }, // Text area width minus padding
            color: '#000',
            align: 'left'
        }).setOrigin(0, 0);
        this.dialogLayout.setText(dialogText);
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
        const buttonContainers = [];

        displayButtons.forEach((btn) => {
            const btnText = this.scene.add.text(0, 0, btn.label, {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#fff',
                align: 'center'
            });

            const textWidth = btnText.width;
            const buttonWidth = Math.max(100, textWidth + 20);
            const buttonHeight = 30;

            const btnBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x444444)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .setDepth(2001)
                .on('pointerover', () => btnBg.setFillStyle(0x666666))
                .on('pointerout', () => btnBg.setFillStyle(0x444444))
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    btn.onClick();
                });

            btnText.setPosition(0, 0);
            btnText.setOrigin(0.5);
            btnText.setDepth(2002);

            // Create a container for the button
            const buttonContainer = this.scene.add.container(0, 0, [btnBg, btnText]);
            buttonContainer.width = buttonWidth;
            buttonContainer.height = buttonHeight;

            buttonContainers.push(buttonContainer);
        });

        this.dialogLayout.setButtons(buttonContainers);
        this.buttonElements = buttonContainers.flatMap(container => container.list);
    }

    renderExitButton(exitButton, dialogWidth, dialogHeight) {
        if (!exitButton) return;

        const exitBtnText = this.scene.add.text(0, 0, exitButton.label, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center'
        });

        const exitTextWidth = exitBtnText.width;
        const exitButtonWidth = Math.max(100, exitTextWidth + 20);
        const exitButtonHeight = 30;

        const exitBtnBg = this.scene.add.rectangle(0, 0, exitButtonWidth, exitButtonHeight, 0x444444)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(2001)
            .on('pointerover', () => exitBtnBg.setFillStyle(0x666666))
            .on('pointerout', () => exitBtnBg.setFillStyle(0x444444))
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                exitButton.onClick();
            });

        exitBtnText.setPosition(0, 0);
        exitBtnText.setOrigin(0.5);
        exitBtnText.setDepth(2002);

        // Create a container for the exit button
        const exitButtonContainer = this.scene.add.container(0, 0, [exitBtnBg, exitBtnText]);
        exitButtonContainer.width = exitButtonWidth;
        exitButtonContainer.height = exitButtonHeight;

        this.dialogLayout.setExitButton(exitButtonContainer);
        this.buttonElements.push(exitBtnBg, exitBtnText);
    }

    renderBottomButtons(bottomButtons, dialogWidth, dialogHeight) {
        if (!bottomButtons || bottomButtons.length === 0) return;

        const buttonContainers = [];

        bottomButtons.forEach((btn) => {
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

            const buttonWidth = 60;
            const buttonHeight = 30;

            const btnBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, buttonColor)
                .setOrigin(0.5)
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

            btnText.setPosition(0, 0);
            btnText.setOrigin(0.5);
            btnText.setDepth(2002);

            // Create a container for the bottom button
            const buttonContainer = this.scene.add.container(0, 0, [btnBg, btnText]);
            buttonContainer.width = buttonWidth;
            buttonContainer.height = buttonHeight;

            buttonContainers.push(buttonContainer);
        });

        this.dialogLayout.setBottomButtons(buttonContainers);
        this.buttonElements.push(...buttonContainers.flatMap(container => container.list));
    }

    addToContainer(npcImage) {
        const containerItems = [];

        // Add layout elements to container
        if (this.dialogLayout) {
            Object.values(this.dialogLayout.elements).forEach(element => {
                if (Array.isArray(element)) {
                    containerItems.push(...element);
                } else if (element) {
                    containerItems.push(element);
                }
            });
        }

        // Add npcImage if provided (for backward compatibility)
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

        // Clear the layout system (elements will be destroyed with container)
        if (this.dialogLayout) {
            this.dialogLayout.clear();
            this.dialogLayout = null;
        }

        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }

        // buttonElements are now part of the container, so they get destroyed with it
        this.buttonElements = null;
    }
}

export default DialogManager;