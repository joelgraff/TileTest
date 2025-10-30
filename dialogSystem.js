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
        const dialogHeight = Math.min(this.isMobile ? 260 : 340, cam.height * (this.isMobile ? 0.8 : 0.65));

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

        // Create main container
        this.dialogContainer = this.scene.add.container(cam.width / 2, cam.height / 2);

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

            // Set word wrap width based on available space
            const availableWidth = hasImage ? contentWidth - 180 : contentWidth - 40;
            text.setWordWrapWidth(availableWidth);

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
        // Handle main buttons (vertical stack)
        if (dialogData.buttons && dialogData.buttons.length > 0) {
            let buttonY = startY + 25;

            console.log('Button Layout - hasImage:', hasImage, 'buttonStyle:', dialogData.buttonStyle, 'buttonPosition:', dialogData.buttonPosition, 'startY:', startY, 'buttonY:', buttonY);
            const mainX = dialogData.buttonStyle === 'link' ? -80 : (hasImage ? contentWidth / 4 : 0); // Left edge for bottomLeft, left-align links near center for others, offset regular buttons with images
            const buttonSpacing = dialogData.buttonStyle === 'link' ? 20 : 35; // Closer spacing for links

            dialogData.buttons.forEach((btnConfig, index) => {
                const buttonType = dialogData.buttonStyle === 'link' ? 'linkButton' : 'button';
                const btn = this.assetFactory.createAsset({
                    type: buttonType,
                    label: btnConfig.label,
                    onClick: btnConfig.onClick,
                    disabled: btnConfig.disabled,
                    options: btnConfig.options
                });

                btn.setPosition(mainX, buttonY + (index * buttonSpacing));
                this.dialogContainer.add(btn);
            });
        }

        // Handle left buttons (horizontal row, typically pagination)
        if (dialogData.leftButtons && dialogData.leftButtons.length > 0) {
            const leftX = hasImage ? -contentWidth / 2 + 80 : -contentWidth / 2;
            // Position at bottom if no main buttons (topic content screens)
            const buttonY = dialogData.buttons && dialogData.buttons.length > 0 ? startY + 32 : contentHeight / 2 - 15;
            console.log('Left buttons positioning - hasMainButtons:', !!(dialogData.buttons && dialogData.buttons.length > 0), 'buttonY:', buttonY);

            let currentX = leftX;
            dialogData.leftButtons.forEach((btnConfig, index) => {
                const btn = this.assetFactory.createAsset({
                    type: 'button',
                    label: btnConfig.label,
                    onClick: btnConfig.onClick,
                    disabled: btnConfig.disabled,
                    options: btnConfig.options || {}
                });
                console.log('Left Button Positioning - index:', index, 'currentX:', currentX, 'buttonY:', buttonY, 'name:', btnConfig.label);
                // Position button so its left edge is at currentX
                btn.setPosition(currentX + btn.width / 2, buttonY);
                this.dialogContainer.add(btn);
                console.log('button width:', btn.width);
                // Move to next position with some spacing
                currentX += btn.width + 10; // Add 10px spacing between buttons
            });
        }

        // Handle bottom buttons (horizontal row at bottom)
        if (dialogData.bottomButtons && dialogData.bottomButtons.length > 0) {
            const bottomBtnCount = dialogData.bottomButtons.length;
            const totalWidth = bottomBtnCount * 80 + (bottomBtnCount - 1) * 10;
            let startX = -totalWidth / 2;

            if (hasImage) {
                // For dialogs with images, align to the left
                startX = -contentWidth / 2 + 20;
            }

            dialogData.bottomButtons.forEach((btnConfig, index) => {
                const btn = this.assetFactory.createAsset({
                    type: 'button',
                    label: btnConfig.label,
                    onClick: btnConfig.onClick,
                    disabled: btnConfig.disabled,
                    options: { ...(btnConfig.options || {}), width: hasImage ? 60 : undefined }
                });

                btn.setPosition(startX + (index * 90), contentHeight / 2 - 10);
                this.dialogContainer.add(btn);
            });
        }

        // Handle exit button (bottom position based on exitButtonPosition)
        if (dialogData.exitButton) {
            const exitBtn = this.assetFactory.createAsset({
                type: 'button',
                label: dialogData.exitButton.label,
                onClick: dialogData.exitButton.onClick,
                options: dialogData.exitButton.options
            });
            const exitX = dialogData.exitButtonPosition === 'right' ? contentWidth / 2 - 55 : 0; // Right side with margin
            exitBtn.setPosition(exitX, contentHeight / 2 - 15); // Slightly lower
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