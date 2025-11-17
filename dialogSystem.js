import { AssetFactory } from './ui/index.js';

/**
 * DialogSystem - Simplified dialog management system
 * Combines dialog lifecycle and layout functionality into a single class
 */
class DialogSystem {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        this.assetFactory = new AssetFactory(scene);

        // Cache mobile detection for performance
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Show dialog with simplified content structure
     * @param {Object} dialogData - Dialog content and configuration
     */
    showDialog(dialogData) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;

        // Clear any existing input state to prevent player movement
        if (this.scene.inputManager) {
            this.scene.inputManager.target = null;
            this.scene.inputManager.isDragging = false;
            this.scene.inputManager.direction = { x: 0, y: 0 };
        }

        const cam = this.scene.cameras.main;
        const dialogWidth = Math.min(this.isMobile ? 400 : 600, cam.width * (this.isMobile ? 0.9 : 0.85));

        // Increase dialog height if there are bottom buttons to prevent overlap
        let dialogHeight = Math.min(this.isMobile ? 260 : 280, cam.height * (this.isMobile ? 0.8 : 0.65));
        if (dialogData.bottomButtons && dialogData.bottomButtons.length > 0) {
            dialogHeight = Math.min(this.isMobile ? 340 : 360, cam.height * (this.isMobile ? 0.95 : 0.8));
        }

        // Increase dialog height for dialogs with many buttons that may overflow.
        // Be conservative: only expand when buttons are shown at the bottom (or bottom-left),
        // and use tighter estimates for 'link' style buttons (e.g. help topics).
        if (dialogData.buttons && dialogData.buttons.length > 0 && (dialogData.buttonPosition === 'bottomLeft' || dialogData.buttonPosition === 'right' || dialogData.buttonPosition === undefined)) {
            // Use tighter spacing for link-style buttons (help topics are links)
            const isLinkStyle = dialogData.buttonStyle === 'link';
            const buttonSpacing = isLinkStyle ? 8 : 20; // smaller gap for link buttons
            const estimatedButtonHeight = isLinkStyle ? 20 : 28; // slightly smaller for link buttons

            // Only consider vertical stacking for bottom-positioned buttons
            const totalButtonSpace = dialogData.buttons.length * (estimatedButtonHeight + buttonSpacing);

            // Estimate available vertical space inside dialog after title/text area
            const estimatedContentSpace = Math.max(0, dialogHeight - 100); // leave room for title/margins
            const overflowSpace = Math.max(0, totalButtonSpace - estimatedContentSpace);

            if (overflowSpace > 0) {
                // Add conservatively: round up in 20px increments and cap the addition
                const addPixels = Math.min( Math.ceil(overflowSpace / 20) * 20, 120 );
                dialogHeight += addPixels;
                // Cap absolute dialog height to a sensible portion of the screen
                dialogHeight = Math.min(dialogHeight, cam.height * (this.isMobile ? 0.9 : 0.8));
            }
        }

        // Increase dialog height by 40 pixels for inventory dialogs
        if (dialogData.text && dialogData.text.includes('INVENTORY')) {
            // For inventory dialogs, only add significant height if there are items to display
            // Check if there are drop buttons (indicating items) or pagination buttons
            const hasItems = (dialogData.buttons && dialogData.buttons.length > 0) ||
                           (dialogData.leftButtons && dialogData.leftButtons.length > 0);
            if (hasItems) {
                dialogHeight += 160; // Full height increase for dialogs with items
            } else {
                dialogHeight += 40; // Smaller increase for empty inventory
            }
        }

        // Increase dialog height for quests with leftButtons (pagination)
        if (dialogData.leftButtons && dialogData.leftButtons.length > 0) {
            dialogHeight += 60; // Add height for pagination buttons
        }

        // Create dialog container and overlay
        this.createDialogStructure(cam, dialogWidth, dialogHeight);

        // Create and layout dialog content
        this.createDialogContent(dialogData, dialogWidth, dialogHeight);

        // Add everything to the scene
        this.scene.add.existing(this.overlay);
        this.scene.add.existing(this.dialogContainer);
        this.dialogContainer.setDepth(50000);
    }

    /**
     * Create the basic dialog structure (overlay and container)
     */
    createDialogStructure(cam, dialogWidth, dialogHeight) {
        // Create overlay
        this.overlay = this.scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(49999)
            .setInteractive()
            .on('pointerdown', () => this.hideDialog());

        // Create main container - position at screen center and make it fixed to camera
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height / 2);
        this.dialogContainer.setScrollFactor(0, 0); // Make it fixed to screen, not world

        // Create background
        const bg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0x333333, 1)
            .setStrokeStyle(2, 0xFFFFFF);
        this.dialogContainer.add(bg);
    }

    /**
     * Create and layout dialog content
     */
    createDialogContent(dialogData, dialogWidth, dialogHeight) {
        const margin = 10;
        const contentWidth = dialogWidth - (margin * 2);
        const contentHeight = dialogHeight - (margin * 2);
        let currentY = -contentHeight / 2;

        // Title
        if (dialogData.title) {
            const title = this.assetFactory.createAsset({
                type: 'text',
                text: dialogData.title,
                style: { fontSize: '20px', fontStyle: 'bold', color: '#fff', align: 'center' }
            });
            title.setPosition(0, currentY + 15);
            title.setOrigin(0.5, 0); // Center horizontally, align to top
            this.dialogContainer.add(title);
            currentY += 40;
        }

        // Image (if present)
        let hasImage = false;
        if (dialogData.imageKey) {
            const image = this.assetFactory.createAsset({
                type: 'image',
                key: dialogData.imageKey,
                displaySize: { width: 90, height: 134 },
                isAvatar: true
            });
            image.setPosition(-contentWidth / 2 + 50, currentY + 67);
            this.dialogContainer.add(image);
            hasImage = true;
        }

        // Text content
        if (dialogData.text) {
            const textContent = Array.isArray(dialogData.text) ? dialogData.text.join('\n') : String(dialogData.text);
            const text = this.assetFactory.createAsset({
                type: 'text',
                text: textContent,
                style: { fontSize: '16px', fontStyle: 'normal', color: '#ffffff', align: 'left' }
            });

            // Position text based on whether there's an image
            const textX = hasImage ? -contentWidth / 2 + 160 : -contentWidth / 2 + 20;
            const textY = currentY + 20;
            console.log(textContent, hasImage);
            console.log('Dialog Text Position:', textX, textY);
            text.setPosition(textX, textY);

            // Set word wrap width based on available space (use column width for inventory dialogs)
            const isInventoryDialog = dialogData.text && dialogData.text.includes('INVENTORY');
            const availableWidth = isInventoryDialog ?
                (contentWidth * 0.75 - (hasImage ? 140 : 20)) :
                (hasImage ? contentWidth - 180 : contentWidth - 40);

            // Disable word wrapping for inventory dialogs to ensure proper button positioning
            if (!isInventoryDialog) {
                text.setWordWrapWidth(availableWidth);
            }

            this.dialogContainer.add(text);
            currentY += text.height + 30;
        }

        // Buttons
        this.layoutButtons(dialogData, contentWidth, contentHeight, currentY, hasImage);
    }

    /**
     * Layout buttons based on dialog configuration
     */
    layoutButtons(dialogData, contentWidth, contentHeight, startY, hasImage) {
        // For inventory dialogs, use 75/25 column split
        const isInventoryDialog = dialogData.text && dialogData.text.includes('INVENTORY');
        const textColumnLeft = hasImage ? -contentWidth / 2 + 160 : -contentWidth / 2 + 20;
        const textColumnWidth = isInventoryDialog ? contentWidth * 0.75 - (hasImage ? 140 : 20) : (hasImage ? contentWidth - 180 : contentWidth - 40);

        // Calculate text Y position (same logic as in createDialogContent)
        const titleHeight = dialogData.title ? 40 : 0;
        const textY = -contentHeight / 2 + titleHeight + 20;

        // Handle main buttons (vertical stack)
        if (dialogData.buttons && dialogData.buttons.length > 0) {
            let buttonY = startY + 25;

            console.log('Button Layout - hasImage:', hasImage, 'buttonStyle:', dialogData.buttonStyle, 'buttonPosition:', dialogData.buttonPosition, 'startY:', startY, 'buttonY:', buttonY);
            const mainX = dialogData.buttonStyle === 'link' ? -80 : (hasImage ? contentWidth / 4 : 0); // Left edge for bottomLeft, left-align links near center for others, offset regular buttons with images
            const buttonSpacing = dialogData.buttonStyle === 'link' ? 20 : 35; // Closer spacing for links

            // Adjust positioning for right-side buttons
            if (dialogData.buttonPosition === 'right') {
                // For inventory-style dialogs, use column layout
                if (isInventoryDialog) {
                    const textContent = Array.isArray(dialogData.text) ? dialogData.text.join('\n') : String(dialogData.text);
                    const lines = textContent.split('\n');
                    const lineHeight = 16; // Approximate line height

                    // Right column starts at 75% of content width
                    const rightColumnLeft = -contentWidth / 2 + (contentWidth * 0.75);

                    dialogData.buttons.forEach((btnConfig, index) => {
                        const buttonType = dialogData.buttonStyle === 'link' ? 'linkButton' : 'button';
                        const btn = this.assetFactory.createAsset({
                            type: buttonType,
                            label: btnConfig.label,
                            onClick: btnConfig.onClick,
                            disabled: btnConfig.disabled,
                            options: btnConfig.options
                        });

                        // Find the line with the item number for this specific button index
                        // Button index 0 corresponds to item 1, index 1 to item 2, etc.
                        let itemLineIndex = -1;
                        let itemCount = 0;
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].match(/^\d+\.\s/)) {
                                if (itemCount === index) { // This is the item line for this button
                                    itemLineIndex = i;
                                    break;
                                }
                                itemCount++;
                            }
                        }

                        if (itemLineIndex !== -1) {
                            // Position button in right column, aligned with close button for inventory dialogs
                            const itemLineY = textY + (itemLineIndex * lineHeight) + (lineHeight / 2);
                            let buttonX;
                            if (isInventoryDialog) {
                                // Align right edge with close button (center at contentWidth / 2 - 55)
                                buttonX = contentWidth / 2 - 55;
                            } else {
                                buttonX = rightColumnLeft + btn.width / 2 + 10;
                            }
                            btn.setPosition(buttonX, itemLineY);
                        } else {
                            // Fallback to spaced positioning in right column
                            let buttonX;
                            if (isInventoryDialog) {
                                buttonX = contentWidth / 2 - 55;
                            } else {
                                buttonX = rightColumnLeft + btn.width / 2 + 10;
                            }
                            btn.setPosition(buttonX, buttonY + (index * buttonSpacing));
                        }
                        this.dialogContainer.add(btn);
                    });
                } else {
                    // Default right-side positioning for other dialogs
                    buttonY = startY - 20; // Start near top of text area
                    dialogData.buttons.forEach((btnConfig, index) => {
                        const buttonType = dialogData.buttonStyle === 'link' ? 'linkButton' : 'button';
                        const btn = this.assetFactory.createAsset({
                            type: buttonType,
                            label: btnConfig.label,
                            onClick: btnConfig.onClick,
                            disabled: btnConfig.disabled,
                            options: btnConfig.options
                        });

                        let buttonX = mainX;
                        if (dialogData.buttonPosition === 'right') {
                            // Position buttons to the right of text
                            buttonX = textColumnLeft + textColumnWidth + 20 + btn.width / 2; // Left edge 20px from text right edge
                        }

                        btn.setPosition(buttonX, buttonY + (index * buttonSpacing));
                        this.dialogContainer.add(btn);
                    });
                }
            } else {
                // Default positioning below text
                dialogData.buttons.forEach((btnConfig, index) => {
                    const buttonType = dialogData.buttonStyle === 'link' ? 'linkButton' : 'button';
                    const btn = this.assetFactory.createAsset({
                        type: buttonType,
                        label: btnConfig.label,
                        onClick: btnConfig.onClick,
                        disabled: btnConfig.disabled,
                        options: btnConfig.options
                    });

                    let buttonX = mainX;
                    if (dialogData.buttonAlignment === 'textLeft') {
                        buttonX = textColumnLeft + btn.width / 2;
                    } else if (dialogData.buttonAlignment === 'textCenter') {
                        buttonX = textColumnLeft + (textColumnWidth / 2);
                    } else if (dialogData.buttonAlignment === 'textRight') {
                        buttonX = textColumnLeft + textColumnWidth - btn.width / 2;
                    }

                    btn.setPosition(buttonX, buttonY + (index * buttonSpacing));
                    this.dialogContainer.add(btn);
                });
            }
        }

        // Handle left buttons (horizontal row, typically pagination)
        if (dialogData.leftButtons && dialogData.leftButtons.length > 0) {
            // For quest dialogs, use special positioning with page indicator in upper right
            const isQuestDialog = dialogData.isQuestDialog === true;
            const buttonMargin = 15; // Consistent margin from dialog edges

            let leftButton = null;
            let pageButton = null;
            let rightButton = null;

            // Separate buttons by type
            dialogData.leftButtons.forEach((btnConfig) => {
                if (btnConfig.label === '<') {
                    leftButton = btnConfig;
                } else if (btnConfig.label === '>') {
                    rightButton = btnConfig;
                } else {
                    pageButton = btnConfig;
                }
            });

            if (isQuestDialog) {
                // Page indicator in upper right (as text, not a button)
                if (pageButton) {
                    const pageText = this.assetFactory.createAsset({
                        type: 'text',
                        text: pageButton.label,
                        style: { fontSize: '14px', fontStyle: 'normal', color: '#ffffff', align: 'right' }
                    });
                    const pageX = contentWidth / 2 - 20; // Right side with margin
                    const pageY = -contentHeight / 2 + buttonMargin + 5;
                    pageText.setOrigin(1, 0); // Right-align the text
                    pageText.setPosition(pageX, pageY);
                    this.dialogContainer.add(pageText);
                }

                // Navigation buttons at bottom left
                const bottomButtonY = contentHeight / 2 - buttonMargin - 5;
                let currentX = -contentWidth / 2 + buttonMargin;

                if (leftButton) {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: leftButton.label,
                        onClick: leftButton.onClick,
                        disabled: leftButton.disabled,
                        options: leftButton.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, bottomButtonY);
                    this.dialogContainer.add(btn);
                    currentX += btn.width + 5;
                }

                if (rightButton) {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: rightButton.label,
                        onClick: rightButton.onClick,
                        disabled: rightButton.disabled,
                        options: rightButton.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, bottomButtonY);
                    this.dialogContainer.add(btn);
                }
            } else {
                // Standard positioning for non-quest dialogs (legacy behavior)
                const buttonY = contentHeight / 2 - 20;
                let currentX = -contentWidth / 2 + 20;

                if (leftButton) {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: leftButton.label,
                        onClick: leftButton.onClick,
                        disabled: leftButton.disabled,
                        options: leftButton.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, buttonY);
                    this.dialogContainer.add(btn);
                    currentX += btn.width + 5;
                }

                if (rightButton) {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: rightButton.label,
                        onClick: rightButton.onClick,
                        disabled: rightButton.disabled,
                        options: rightButton.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, buttonY);
                    this.dialogContainer.add(btn);
                }

                if (pageButton) {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: pageButton.label,
                        onClick: pageButton.onClick,
                        disabled: pageButton.disabled,
                        options: pageButton.options || {}
                    });
                    const pageX = contentWidth / 2 - btn.width / 2 - 20;
                    btn.setPosition(pageX, buttonY);
                    this.dialogContainer.add(btn);
                }
            }
        }

        // Handle bottom buttons (horizontal row at bottom)
        if (dialogData.bottomButtons && dialogData.bottomButtons.length > 0) {
            const bottomBtnCount = dialogData.bottomButtons.length;

            if (dialogData.bottomButtonsAlign === 'split') {
                // Split layout: Back button on left, pagination aligned with right column
                const lastBtnConfig = dialogData.bottomButtons[bottomBtnCount - 1];
                const lastBtn = this.assetFactory.createAsset({
                    type: 'button',
                    label: lastBtnConfig.label,
                    onClick: lastBtnConfig.onClick,
                    disabled: lastBtnConfig.disabled,
                    options: lastBtnConfig.options || {}
                });
                // Position last button (Back) at left edge
                lastBtn.setPosition(-contentWidth / 2 + lastBtn.width / 2, contentHeight / 2 - 10);
                this.dialogContainer.add(lastBtn);

                // Position remaining buttons (pagination) aligned with left edge of right column
                if (bottomBtnCount > 1) {
                    // Calculate the left edge of the right column (where text starts when there's an image)
                    const rightColumnLeft = hasImage ? -contentWidth / 2 + 160 : -contentWidth / 2 + 20;
                    let currentX = rightColumnLeft;

                    // Layout pagination buttons from left to right
                    for (let i = 0; i < bottomBtnCount - 1; i++) {
                        const btnConfig = dialogData.bottomButtons[i];
                        const btn = this.assetFactory.createAsset({
                            type: 'button',
                            label: btnConfig.label,
                            onClick: btnConfig.onClick,
                            disabled: btnConfig.disabled,
                            options: btnConfig.options || {}
                        });
                        btn.setPosition(currentX + btn.width / 2, contentHeight / 2 - 10);
                        this.dialogContainer.add(btn);
                        currentX += btn.width + 10;
                    }
                }
            } else if (dialogData.bottomButtonsAlign === 'left') {
                // Align all buttons to left edge of dialog
                let currentX = -contentWidth / 2;
                dialogData.bottomButtons.forEach((btnConfig, index) => {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: btnConfig.label,
                        onClick: btnConfig.onClick,
                        disabled: btnConfig.disabled,
                        options: btnConfig.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, contentHeight / 2 - 10);
                    this.dialogContainer.add(btn);
                    currentX += btn.width + 10;
                });
            } else {
                // Default center alignment
                const totalWidth = bottomBtnCount * 80 + (bottomBtnCount - 1) * 10;
                let startX = -totalWidth / 2;

                if (hasImage) {
                    // For dialogs with images, align to the left
                    startX = -contentWidth / 2 + 20;
                }

                let currentX = startX;
                dialogData.bottomButtons.forEach((btnConfig, index) => {
                    const btn = this.assetFactory.createAsset({
                        type: 'button',
                        label: btnConfig.label,
                        onClick: btnConfig.onClick,
                        disabled: btnConfig.disabled,
                        options: btnConfig.options || {}
                    });
                    btn.setPosition(currentX + btn.width / 2, contentHeight / 2 - 10);
                    this.dialogContainer.add(btn);
                    currentX += btn.width + 10;
                });
            }
        }

        // Handle exit button (bottom position based on exitButtonPosition)
        if (dialogData.exitButton) {
            const exitBtn = this.assetFactory.createAsset({
                type: 'button',
                label: dialogData.exitButton.label,
                onClick: dialogData.exitButton.onClick,
                options: dialogData.exitButton.options
            });

            // For quest dialogs, position close button in lower right with consistent margins
            if (dialogData.isQuestDialog === true) {
                const buttonMargin = 15;
                const exitX = contentWidth / 2 - exitBtn.width / 2 - buttonMargin;
                const exitY = contentHeight / 2 - buttonMargin - 5;
                exitBtn.setPosition(exitX, exitY);
            } else {
                // Standard positioning for other dialogs
                const exitX = dialogData.exitButtonPosition === 'right' ? contentWidth / 2 - 55 : 0;
                exitBtn.setPosition(exitX, contentHeight / 2 - 15);
            }

            this.dialogContainer.add(exitBtn);
        }
    }

    /**
     * Hide the current dialog
     */
    hideDialog() {
        if (this.isDialogOpen) {
            this.scene.isDialogOpen = false;
            this.isDialogOpen = false;
        }

        // If pointer is still down when dialog closes, ignore subsequent pointer events until release
        if (this.scene.inputManager && this.scene.input.activePointer.isDown) {
            this.scene.inputManager.ignorePointerUntilRelease = true;
        }

        // Clean up dialog elements
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
    }
}

export default DialogSystem;