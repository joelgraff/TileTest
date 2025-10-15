/**
 * ButtonFactory - Centralized button creation for consistent UI elements
 * Provides methods for creating different types of buttons with consistent styling
 */
class ButtonFactory {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Create a standard interactive button
     * @param {string} label - Button text
     * @param {Function} onClick - Click handler function
     * @param {Object} options - Button options (width, height, disabled, etc.)
     * @returns {Phaser.GameObjects.Container} Button container
     */
    createButton(label, onClick, options = {}) {
        const {
            width = null, // Auto-calculate if null
            height = 30,
            disabled = false,
            fontSize = '16px',
            fontStyle = 'bold',
            textColor = '#fff',
            bgColor = 0x444444,
            hoverColor = 0x666666,
            disabledColor = 0x222222,
            disabledTextColor = '#666666'
        } = options;

        const btnText = this.scene.add.text(0, 0, label, {
            fontSize: fontSize,
            fontStyle: fontStyle,
            color: disabled ? disabledTextColor : textColor,
            align: 'center'
        });

        const textWidth = btnText.width;
        const buttonWidth = width || Math.max(100, textWidth + 20);
        const buttonHeight = height;

        const buttonColor = disabled ? disabledColor : bgColor;
        const hoverColorFinal = disabled ? disabledColor : hoverColor;

        const btnBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, buttonColor)
            .setOrigin(0.5)
            .setDepth(2001);

        if (!disabled) {
            btnBg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => btnBg.setFillStyle(hoverColorFinal))
                .on('pointerout', () => btnBg.setFillStyle(buttonColor))
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    // Clear any existing input state to prevent player movement
                    if (this.scene.inputManager) {
                        this.scene.inputManager.target = null;
                        this.scene.inputManager.isDragging = false;
                        this.scene.inputManager.direction = { x: 0, y: 0 };
                    }
                    onClick();
                });
        }

        btnText.setPosition(0, 0);
        btnText.setOrigin(0.5);
        btnText.setDepth(2002);

        // Create a container for the button
        const buttonContainer = this.scene.add.container(0, 0, [btnBg, btnText]);
        buttonContainer.width = buttonWidth;
        buttonContainer.height = buttonHeight;

        return buttonContainer;
    }

    /**
     * Create a small button (typically for bottom navigation)
     * @param {string} label - Button text
     * @param {Function} onClick - Click handler function
     * @param {Object} options - Button options
     * @returns {Phaser.GameObjects.Container} Button container
     */
    createSmallButton(label, onClick, options = {}) {
        return this.createButton(label, onClick, {
            width: 60,
            height: 30,
            fontSize: '16px',
            ...options
        });
    }

    /**
     * Create multiple buttons from an array of button configs
     * @param {Array} buttonConfigs - Array of {label, onClick, options} objects
     * @returns {Array<Phaser.GameObjects.Container>} Array of button containers
     */
    createButtons(buttonConfigs) {
        return buttonConfigs.map(config => {
            const { label, onClick, options = {} } = config;
            return this.createButton(label, onClick, options);
        });
    }

    /**
     * Create a link-style button (text-only with underline on hover)
     * @param {string} label - Button text
     * @param {Function} onClick - Click handler function
     * @param {Object} options - Button options
     * @returns {Phaser.GameObjects.Container} Button container
     */
    createLinkButton(label, onClick, options = {}) {
        const {
            fontSize = '18px',
            fontStyle = 'bold',
            textColor = '#fff', // White text normally
            hoverColor = '#0080ff', // Blue on hover
            disabled = false,
            disabledTextColor = '#666666'
        } = options;

        const btnText = this.scene.add.text(0, 0, label, {
            fontSize: fontSize,
            fontStyle: fontStyle,
            color: disabled ? disabledTextColor : textColor,
            align: 'left'
        });

        // Create underline graphics (normal and hover states)
        const underlineNormal = this.scene.add.graphics()
            .lineStyle(2, disabled ? 0x666666 : 0xffffff)
            .moveTo(-btnText.width / 2, btnText.height / 2 + 2)
            .lineTo(btnText.width / 2, btnText.height / 2 + 2)
            .stroke()
            .setVisible(false);

        const underlineHover = this.scene.add.graphics()
            .lineStyle(2, disabled ? 0x666666 : 0x0080ff)
            .moveTo(-btnText.width / 2, btnText.height / 2 + 2)
            .lineTo(btnText.width / 2, btnText.height / 2 + 2)
            .stroke()
            .setVisible(false);

        if (!disabled) {
            // Make the text interactive
            btnText.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    btnText.setColor(hoverColor);
                    underlineHover.setVisible(true);
                })
                .on('pointerout', () => {
                    btnText.setColor(textColor);
                    underlineHover.setVisible(false);
                })
                .on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                    // Clear any existing input state to prevent player movement
                    if (this.scene.inputManager) {
                        this.scene.inputManager.target = null;
                        this.scene.inputManager.isDragging = false;
                        this.scene.inputManager.direction = { x: 0, y: 0 };
                    }
                    onClick();
                });
        }

        btnText.setPosition(0, 0);
        btnText.setOrigin(0.5);
        btnText.setDepth(2002);
        underlineHover.setDepth(2001);

        // Create a container for the link button
        const buttonContainer = this.scene.add.container(0, 0, [underlineHover, btnText]);
        buttonContainer.width = btnText.width;
        buttonContainer.height = btnText.height;

        return buttonContainer;
    }

    /**
     * Create multiple small buttons from an array of button configs
     * @param {Array} buttonConfigs - Array of {label, onClick, options} objects
     * @returns {Array<Phaser.GameObjects.Container>} Array of button containers
     */
    createSmallButtons(buttonConfigs) {
        return buttonConfigs.map(config => {
            const { label, onClick, options = {} } = config;
            return this.createSmallButton(label, onClick, options);
        });
    }

    /**
     * Create multiple link buttons from an array of button configs
     * @param {Array} buttonConfigs - Array of {label, onClick, options} objects
     * @returns {Array<Phaser.GameObjects.Container>} Array of button containers
     */
    createLinkButtons(buttonConfigs) {
        return buttonConfigs.map(config => {
            const { label, onClick, options = {} } = config;
            return this.createLinkButton(label, onClick, options);
        });
    }
}

export default ButtonFactory;