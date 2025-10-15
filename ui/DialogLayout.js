import GridLayout from './GridLayout.js';
import ColumnLayout from './ColumnLayout.js';
import ButtonFactory from './ButtonFactory.js';

/**
 * DialogLayout - Main layout manager for dialog components
 * Orchestrates grid and column layouts for flexible dialog positioning
 */
class DialogLayout {
    constructor(scene, dialogX, dialogY, dialogWidth, dialogHeight) {
        this.scene = scene;
        this.dialogX = dialogX;
        this.dialogY = dialogY;
        this.dialogWidth = dialogWidth;
        this.dialogHeight = dialogHeight;

        // Initialize button factory
        this.buttonFactory = new ButtonFactory(scene);

        // Define layout areas (relative to dialog container origin at 0,0)
        const titleBarHeight = 40;
        const bottomAreaHeight = 40;
        const contentStartY = -dialogHeight / 2 + titleBarHeight;
        const contentHeight = dialogHeight - titleBarHeight - bottomAreaHeight;

        this.areas = {
            titleBar: { x: 0, y: -dialogHeight / 2, width: dialogWidth, height: titleBarHeight },
            leftColumn: { x: -dialogWidth / 2, y: contentStartY, width: dialogWidth / 3, height: contentHeight },
            rightColumn: { x: -dialogWidth / 2 + dialogWidth / 3, y: contentStartY, width: 2 * dialogWidth / 3, height: contentHeight },
            textArea: { x: -dialogWidth / 2 + dialogWidth / 3, y: contentStartY, width: 2 * dialogWidth / 3, height: contentHeight / 3 },
            buttonArea: { x: -dialogWidth / 2 + dialogWidth / 3, y: contentStartY + contentHeight / 3, width: 2 * dialogWidth / 3, height: 2 * contentHeight / 3 },
            bottomArea: { x: 0, y: dialogHeight / 2 - bottomAreaHeight / 2, width: dialogWidth, height: bottomAreaHeight }
        };

        // Storage for dialog elements
        this.elements = {
            titleBar: null,
            title: null,
            image: null,
            text: null,
            buttons: [],
            leftButtons: [],
            bottomButtons: [],
            exitButton: null
        };
    }

    /**
     * Create the dialog overlay
     * @param {Phaser.Cameras.Scene2D.Camera} cam - Scene camera
     * @param {Function} onClickOutside - Handler for clicking outside dialog
     * @returns {Phaser.GameObjects.Rectangle} Overlay rectangle
     */
    createOverlay(cam, onClickOutside) {
        const overlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(1999)
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                onClickOutside();
            })
            .on('pointermove', (pointer, localX, localY, event) => {
                event.stopPropagation();
            })
            .on('pointerup', (pointer, localX, localY, event) => {
                event.stopPropagation();
            });

        return overlay;
    }

    /**
     * Create the dialog container
     * @param {Phaser.Cameras.Scene2D.Camera} cam - Scene camera
     * @returns {Phaser.GameObjects.Container} Dialog container
     */
    createContainer(cam) {
        return this.scene.add.container(cam.width / 2, cam.height - this.dialogHeight / 2 - 16);
    }

    /**
     * Create the dialog background
     * @returns {Phaser.GameObjects.Rectangle} Background rectangle
     */
    createBackground() {
        return this.scene.add.rectangle(0, 0, this.dialogWidth, this.dialogHeight, 0x808080, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x222222)
            .setInteractive()
            .on('pointerdown', (pointer, localX, localY, event) => event.stopPropagation())
            .on('pointermove', (pointer, localX, localY, event) => event.stopPropagation())
            .on('pointerup', (pointer, localX, localY, event) => event.stopPropagation());
    }

    /**
     * Create the title bar with background and text
     * @param {string} title - Dialog title text
     */
    createTitleBar(title) {
        // Create title bar background
        const titleBar = this.scene.add.rectangle(
            0,
            -this.dialogHeight / 2 + 20, // Center of title bar area
            this.dialogWidth,
            40,
            0x333366,
            1
        ).setOrigin(0.5).setStrokeStyle(2, 0x222222);

        const titleText = this.scene.add.text(0, -this.dialogHeight / 2 + 20, title || 'Dialog', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff',
            align: 'center',
            wordWrap: { width: this.dialogWidth - 32 }
        }).setOrigin(0.5);

        this.elements.titleBar = titleBar;
        this.elements.title = titleText;
    }

    /**
     * Set the dialog image (NPC/vendor portrait)
     * @param {Phaser.GameObjects.Image} image - Image object
     */
    setImage(image) {
        // Position image in the left column, centered
        image.setPosition(
            this.areas.leftColumn.x + this.areas.leftColumn.width / 2 - image.width / 2,
            this.areas.leftColumn.y + this.areas.leftColumn.height / 2 - image.height / 2
        );
        this.elements.image = image;
    }

    /**
     * Set the main dialog text content
     * @param {Phaser.GameObjects.Text} text - Text object
     * @param {boolean} hasLeftButtons - Whether the dialog has left column buttons
     */
    setText(text, hasLeftButtons = false) {
        // If there are left buttons, use a reduced height text area to leave space for buttons
        // Otherwise use the text area (upper portion of right column)
        let textArea;
        if (hasLeftButtons) {
            // For dialogs with left buttons (like help topics), use most of right column but leave bottom margin
            const buttonAreaHeight = 80; // Leave space for navigation buttons at bottom
            textArea = {
                x: this.areas.rightColumn.x,
                y: this.areas.rightColumn.y,
                width: this.areas.rightColumn.width,
                height: this.areas.rightColumn.height - buttonAreaHeight
            };
        } else {
            textArea = this.areas.textArea;
        }

        // Position text in the text area with proper margins
        text.setPosition(
            textArea.x + 8, // Small padding from left edge
            textArea.y + 8   // Small padding from top edge (reduced from 30px)
        );
        this.elements.text = text;
    }

    /**
     * Add main dialog buttons (typically in a grid layout)
     * @param {Array} buttonConfigs - Array of button config objects with {label, onClick, options}
     */
    createButtons(buttonConfigs) {
        // Clear existing buttons
        this.elements.buttons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.buttons = [];

        if (buttonConfigs.length === 0) return;

        const buttonContainers = this.buttonFactory.createButtons(buttonConfigs);

        // Always arrange vertically with dynamic spacing to fit all buttons
        this.arrangeButtonsVertically(buttonContainers);
    }

    /**
     * Add link-style buttons (text-only with underline on hover)
     * @param {Array} buttonConfigs - Array of button config objects with {label, onClick, options}
     */
    createLinkButtons(buttonConfigs) {
        // Clear existing buttons
        this.elements.buttons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.buttons = [];

        if (buttonConfigs.length === 0) return;

        const buttonContainers = this.buttonFactory.createLinkButtons(buttonConfigs);

        // Arrange link buttons vertically with appropriate spacing
        this.arrangeLinkButtonsVertically(buttonContainers);
    }

    arrangeLinkButtonsVertically(buttonContainers) {
        const buttonSpacing = 25; // Smaller spacing for link buttons
        const availableHeight = this.areas.buttonArea.height;
        const totalButtonHeight = buttonContainers.length * buttonSpacing;

        // Center the button stack vertically in the button area
        let buttonYStart = this.areas.buttonArea.y + (availableHeight - totalButtonHeight) / 2 + buttonSpacing / 2;

        buttonContainers.forEach((button, index) => {
            // Position link buttons with left alignment in the button area
            const buttonX = this.areas.buttonArea.x + 16; // Left padding
            const buttonY = buttonYStart + index * buttonSpacing;
            button.setPosition(buttonX, buttonY);
            this.elements.buttons.push(button);
        });
    }

    arrangeButtonsVertically(buttonContainers) {
        // Use smaller spacing for many buttons to fit them all
        const buttonSpacing = buttonContainers.length > 4 ? 30 : 38;
        const availableHeight = this.areas.buttonArea.height;
        const totalButtonHeight = buttonContainers.length * buttonSpacing;

        // If buttons don't fit, reduce spacing further
        const actualSpacing = totalButtonHeight > availableHeight ? availableHeight / buttonContainers.length : buttonSpacing;

        // Center the button stack vertically in the button area
        let buttonYStart = this.areas.buttonArea.y + (availableHeight - buttonContainers.length * actualSpacing) / 2 + actualSpacing / 2;

        buttonContainers.forEach((button, index) => {
            // Position buttons with left edge at button area start to avoid left column intrusion
            const buttonX = this.areas.buttonArea.x + button.width / 2 + 8; // Left-align with small padding
            const buttonY = buttonYStart + index * actualSpacing;
            button.setPosition(buttonX, buttonY);
            this.elements.buttons.push(button);
        });
    }

    arrangeButtonsInGrid(buttonContainers) {
        const buttonSpacingX = 10;
        const buttonSpacingY = 35;
        const buttonsPerRow = 2; // 2 columns for grid layout

        const startX = this.areas.buttonArea.x + 8;
        const startY = this.areas.buttonArea.y + 10;

        buttonContainers.forEach((button, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;

            const buttonX = startX + col * (button.width + buttonSpacingX) + button.width / 2;
            const buttonY = startY + row * buttonSpacingY + button.height / 2;

            button.setPosition(buttonX, buttonY);
            this.elements.buttons.push(button);
        });
    }

    /**
     * Add bottom buttons (pagination, etc.)
     * @param {Array} buttonConfigs - Array of button config objects with {label, onClick, options}
     */
    createBottomButtons(buttonConfigs) {
        // Clear existing bottom buttons
        this.elements.bottomButtons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.bottomButtons = [];

        const buttonContainers = this.buttonFactory.createSmallButtons(buttonConfigs);

        // Position bottom buttons horizontally centered (relative to container)
        const totalWidth = buttonContainers.reduce((width, button) => width + button.width + 10, 0) - 10;
        let currentX = -totalWidth / 2;

        buttonContainers.forEach(button => {
            button.setPosition(currentX + button.width / 2, this.areas.bottomArea.y);
            currentX += button.width + 10;
            this.elements.bottomButtons.push(button);
        });
    }

    /**
     * Add left column buttons
     * @param {Array} buttonConfigs - Array of button config objects with {label, onClick, options}
     */
    createLeftButtons(buttonConfigs) {
        // Clear existing left buttons
        this.elements.leftButtons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.leftButtons = [];

        const buttonContainers = this.buttonFactory.createSmallButtons(buttonConfigs);

        // Special case: Help navigation layout (nav buttons on same row, back button below)
        if (buttonConfigs.length === 3 &&
            buttonConfigs[0].label === '<' &&
            buttonConfigs[1].label === '>') {

            // Calculate the width needed for the "Back to Topics" button based on text
            const backButtonText = buttonConfigs[2].label;
            const tempText = this.scene.add.text(0, 0, backButtonText, {
                fontSize: '16px',
                fontStyle: 'bold'
            });
            const textWidth = tempText.width;
            tempText.destroy();

            const backButtonWidth = Math.max(140, textWidth + 24); // Minimum 140px, padding for text

            // Calculate navigation button width: (backButtonWidth - spacing) / 2
            const navSpacing = 8; // Space between navigation buttons
            const navButtonWidth = Math.max(35, (backButtonWidth - navSpacing) / 2); // Minimum 35px each

            // Create buttons with calculated widths
            const navButtonOptions = { width: navButtonWidth, ...buttonConfigs[0].options };
            const backButtonOptions = { width: backButtonWidth, ...buttonConfigs[2].options };

            const navButton1 = this.buttonFactory.createSmallButton(buttonConfigs[0].label, buttonConfigs[0].onClick, navButtonOptions);
            const navButton2 = this.buttonFactory.createSmallButton(buttonConfigs[1].label, buttonConfigs[1].onClick, navButtonOptions);
            const backButton = this.buttonFactory.createSmallButton(buttonConfigs[2].label, buttonConfigs[2].onClick, backButtonOptions);

            // Position navigation buttons horizontally on the same row at bottom with margin
            const bottomMargin = 20; // Margin from bottom of left column
            const buttonSpacing = 8; // Space between navigation buttons
            const navRowY = this.areas.leftColumn.y + this.areas.leftColumn.height - bottomMargin;

            // Position back button first (centered at bottom)
            const backButtonX = this.areas.leftColumn.x + this.areas.leftColumn.width / 2;
            const backButtonY = navRowY - 35; // Position above navigation buttons
            backButton.setPosition(backButtonX, backButtonY);
            this.elements.leftButtons.push(backButton);

            // Position navigation buttons: their combined width + spacing = back button width
            // Center them as a group below the back button
            const totalNavWidth = navButton1.width + buttonSpacing + navButton2.width;
            const navStartX = backButtonX - totalNavWidth / 2;

            // Position '<' button
            const navButton1X = navStartX + navButton1.width / 2;
            navButton1.setPosition(navButton1X, navRowY);
            this.elements.leftButtons.push(navButton1);

            // Position '>' button
            const navButton2X = navStartX + navButton1.width + buttonSpacing + navButton2.width / 2;
            navButton2.setPosition(navButton2X, navRowY);
            this.elements.leftButtons.push(navButton2);

        } else {
            // Default vertical layout
            const buttonSpacing = 35;
            const leftColumnBottom = this.areas.leftColumn.y + this.areas.leftColumn.height;

            // Start from bottom and work upwards
            let currentY = leftColumnBottom - buttonSpacing / 2;

            buttonContainers.forEach(button => {
                const buttonX = this.areas.leftColumn.x + this.areas.leftColumn.width / 2;
                button.setPosition(buttonX, currentY);
                currentY -= buttonSpacing;
                this.elements.leftButtons.push(button);
            });
        }
    }

    /**
     * Create the exit button
     * @param {Object} exitButtonConfig - Button config with {label, onClick, options}
     */
    createExitButton(exitButtonConfig) {
        if (!exitButtonConfig) return;

        const exitButton = this.buttonFactory.createButton(
            exitButtonConfig.label,
            exitButtonConfig.onClick,
            exitButtonConfig.options
        );

        // Position in bottom right corner (relative to container)
        exitButton.setPosition(
            this.dialogWidth / 2 - exitButton.width / 2 - 10,
            this.areas.bottomArea.y
        );
        this.elements.exitButton = exitButton;
    }

    /**
     * Clear all elements from the dialog layout
     */
    clear() {
        // Note: Elements are not destroyed here as they will be destroyed
        // when the dialog container is destroyed

        // Reset elements storage
        this.elements = {
            titleBar: null,
            title: null,
            image: null,
            text: null,
            buttons: [],
            leftButtons: [],
            bottomButtons: [],
            exitButton: null
        };
    }

    /**
     * Get layout area bounds for custom positioning
     * @param {string} areaName - Name of the predefined area
     * @returns {Object} Area bounds with x, y, width, height (relative to container)
     */
    getArea(areaName) {
        if (this.areas[areaName]) {
            return { ...this.areas[areaName] };
        }
        return null;
    }
}

export default DialogLayout;