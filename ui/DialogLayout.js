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
     */
    setText(text) {
        // Position text in the text area (upper right)
        // Shift down one line (approximately 22 pixels) for better positioning
        text.setPosition(
            this.areas.textArea.x + 8, // Small padding from left edge
            this.areas.textArea.y + 8 + 22  // Small padding from top edge + one line offset
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

        const buttonContainers = this.buttonFactory.createButtons(buttonConfigs);

        const buttonSpacing = 38;
        const availableHeight = this.areas.buttonArea.height;
        const totalButtonHeight = buttonContainers.length * buttonSpacing;

        // Center the button stack vertically in the button area
        let buttonYStart = this.areas.buttonArea.y + (availableHeight - totalButtonHeight) / 2;

        buttonContainers.forEach((button, index) => {
            // Position buttons with left edge at button area start to avoid left column intrusion
            const buttonX = this.areas.buttonArea.x + button.width / 2 + 8; // Left-align with small padding
            const buttonY = buttonYStart + index * buttonSpacing;
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