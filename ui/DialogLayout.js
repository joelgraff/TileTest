import GridLayout from './GridLayout.js';
import ColumnLayout from './ColumnLayout.js';

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

        // Create layout managers for different areas (relative to container)
        this.titleLayout = new ColumnLayout(scene,
            this.areas.titleBar.x,
            this.areas.titleBar.y,
            this.areas.titleBar.width,
            this.areas.titleBar.height,
            5
        );

        // Note: Using simplified direct positioning for content and buttons
        // GridLayout instances removed as they're not needed for current layout

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
     * Set the dialog title
     * @param {Phaser.GameObjects.Text} titleText - Title text object
     */
    setTitle(titleText) {
        // Center title in title bar area
        titleText.setPosition(
            this.areas.titleBar.x,
            this.areas.titleBar.y + this.areas.titleBar.height / 2
        );
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
        text.setPosition(
            this.areas.textArea.x + 8, // Small padding from left edge
            this.areas.textArea.y + 8  // Small padding from top edge
        );
        this.elements.text = text;
    }

    /**
     * Add main dialog buttons (typically in a grid layout)
     * @param {Array<Phaser.GameObjects.Container>} buttons - Array of button objects
     */
    setButtons(buttons) {
        // Clear existing buttons
        this.elements.buttons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.buttons = [];

        const buttonSpacing = 38;
        const availableHeight = this.areas.buttonArea.height;
        const totalButtonHeight = buttons.length * buttonSpacing;

        // Center the button stack vertically in the button area
        let buttonYStart = this.areas.buttonArea.y + (availableHeight - totalButtonHeight) / 2;

        buttons.forEach((button, index) => {
            // Position buttons with left edge at button area start to avoid left column intrusion
            const buttonX = this.areas.buttonArea.x + button.width / 2 + 8; // Left-align with small padding
            const buttonY = buttonYStart + index * buttonSpacing;
            button.setPosition(buttonX, buttonY);
            this.elements.buttons.push(button);
        });
    }

    /**
     * Add bottom buttons (pagination, etc.)
     * @param {Array<Phaser.GameObjects.Container>} buttons - Array of button objects
     */
    setBottomButtons(buttons) {
        // Clear existing bottom buttons
        this.elements.bottomButtons.forEach(button => {
            if (button && button.destroy) button.destroy();
        });
        this.elements.bottomButtons = [];

        // Position bottom buttons horizontally centered (relative to container)
        const totalWidth = buttons.reduce((width, button) => width + button.width + 10, 0) - 10;
        let currentX = -totalWidth / 2;

        buttons.forEach(button => {
            button.setPosition(currentX + button.width / 2, this.areas.bottomArea.y);
            currentX += button.width + 10;
            this.elements.bottomButtons.push(button);
        });
    }

    /**
     * Set the exit button (typically in bottom right)
     * @param {Phaser.GameObjects.Container} button - Exit button object
     */
    setExitButton(button) {
        // Position in bottom right corner (relative to container)
        button.setPosition(
            this.dialogWidth / 2 - button.width / 2 - 10,
            this.areas.bottomArea.y
        );
        this.elements.exitButton = button;
    }

    /**
     * Create a button grid layout for a specific area
     * @param {number} startX - Starting X position relative to dialog container
     * @param {number} startY - Starting Y position relative to dialog container
     * @param {number} areaWidth - Width of the button area
     * @param {number} areaHeight - Height of the button area
     * @param {number} rows - Number of rows in grid
     * @param {number} cols - Number of columns in grid
     * @returns {GridLayout} New grid layout for buttons
     */
    createButtonGrid(startX, startY, areaWidth, areaHeight, rows = 2, cols = 4) {
        return new GridLayout(
            this.scene,
            startX,
            startY,
            areaWidth,
            areaHeight,
            rows,
            cols,
            5
        );
    }

    /**
     * Create a vertical column layout for a specific area
     * @param {number} startX - Starting X position relative to dialog container
     * @param {number} startY - Starting Y position relative to dialog container
     * @param {number} areaWidth - Width of the column area
     * @param {number} areaHeight - Height of the column area
     * @returns {ColumnLayout} New column layout
     */
    createColumn(startX, startY, areaWidth, areaHeight) {
        return new ColumnLayout(
            this.scene,
            startX,
            startY,
            areaWidth,
            areaHeight,
            10
        );
    }

    /**
     * Clear all elements from the dialog layout
     */
    clear() {
        // Clear layout managers
        this.titleLayout.clear();

        // Note: Elements are not destroyed here as they will be destroyed
        // when the dialog container is destroyed

        // Reset elements storage
        this.elements = {
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