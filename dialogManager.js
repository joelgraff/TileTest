import { DialogLayout } from './ui/index.js';

class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
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
        const dialogHeight = Math.min(this.isMobile ? 260 : 340, cam.height * (this.isMobile ? 0.8 : 0.65));

        // Store dialog parameters for pagination callbacks
        this.currentDialogParams = { imageKey, title, text, buttons, exitButton, pagination, bottomButtons, textPagination };

        // Initialize the layout system first
        this.dialogLayout = new DialogLayout(this.scene, cam.width / 2, cam.height - dialogHeight / 2 - 16, dialogWidth, dialogHeight);

        // Create overlay and container using the layout system
        this.overlay = this.createOverlay(cam);
        this.dialogContainer = this.createContainer(cam, dialogWidth, dialogHeight);

        // Create dialog structure
        this.renderBackground(dialogWidth, dialogHeight);
        this.renderTitleBar(title, dialogWidth, dialogHeight);
        this.renderNpcImage(imageKey, dialogWidth, dialogHeight);
        this.renderDialogText(this.handleTextPagination(text, textPagination), dialogWidth, dialogHeight);
        this.renderButtons(this.handleButtonPagination(buttons, pagination, textPagination));
        this.renderBottomButtons(this.handleBottomButtonPagination(bottomButtons, textPagination));
        this.renderExitButton(exitButton);

        this.addElementsToContainer();
    }

    createOverlay(cam) {
        return this.dialogLayout.createOverlay(cam, () => this.hideDialog());
    }

    createContainer(cam, dialogWidth, dialogHeight) {
        return this.dialogLayout.createContainer(cam);
    }

    renderBackground(dialogWidth, dialogHeight) {
        const bg = this.dialogLayout.createBackground();
        this.dialogContainer.add(bg);
    }

    renderTitleBar(title, dialogWidth, dialogHeight) {
        this.dialogLayout.createTitleBar(title);
    }

    renderNpcImage(imageKey, dialogWidth, dialogHeight) {
        if (!imageKey) return null;
        const npcImage = this.scene.add.image(0, 0, imageKey)
            .setDisplaySize(dialogWidth / 6, dialogWidth / 6)
            .setOrigin(0.5, 0.5);
        this.dialogLayout.setImage(npcImage);
        return npcImage;
    }

    renderDialogText(displayText, dialogWidth, dialogHeight) {
        // Calculate word wrap width for approximately 36 characters per line
        // Average character width is ~0.6 * fontSize, so 36 * (0.6 * 18) ≈ 389 pixels
        const textAreaWidth = Math.floor(2 * dialogWidth / 3 - 16);
        const targetWidth = Math.min(textAreaWidth, 389); // Cap at 36 chars worth

        const dialogText = this.scene.add.text(0, 0, displayText, {
            fontSize: '18px',
            fontStyle: 'bold',
            wordWrap: { width: targetWidth },
            color: '#000',
            align: 'left'
        }).setOrigin(0, 0);
        this.dialogLayout.setText(dialogText);
    }

    renderButtons(displayButtons) {
        this.dialogLayout.createButtons(displayButtons);
    }

    renderExitButton(exitButton) {
        this.dialogLayout.createExitButton(exitButton);
    }

    renderBottomButtons(bottomButtons) {
        if (!bottomButtons || bottomButtons.length === 0) return;
        this.dialogLayout.createBottomButtons(bottomButtons);
    }

    addElementsToContainer() {
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

        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000);
    }

    handleTextPagination(text, textPagination) {
        let displayText = text;
        if (textPagination && Array.isArray(text)) {
            const { currentPage = 0 } = textPagination;
            const pages = this.calculateTextPages(text);
            if (currentPage < pages.length) {
                // Join facts with blank lines for readability
                displayText = pages[currentPage].join('\n\n');
            }
        }
        return displayText;
    }

    /**
     * Calculate pages of text based on line and character limits
     * @param {Array<string>} textArray - Array of text items to paginate
     * @returns {Array<Array<string>>} Array of pages, each containing an array of text items
     */
    calculateTextPages(textArray) {
        const pages = [];
        const maxLinesPerPage = 8; // Compromise between button area and no button area dialogs
        const charsPerLine = 36;
        const maxCharsPerPage = maxLinesPerPage * charsPerLine; // ~288 characters per page

        let currentPage = [];
        let currentChars = 0;

        for (const item of textArray) {
            // Calculate characters this item will take (including bullet and spacing)
            const itemChars = item.length + 2; // +2 for bullet and space

            // If adding this item would exceed the page limit, start a new page
            if (currentChars + itemChars > maxCharsPerPage && currentPage.length > 0) {
                pages.push([...currentPage]);
                currentPage = [];
                currentChars = 0;
            }

            // If this single item is too long for any page, we still need to add it
            if (itemChars > maxCharsPerPage) {
                if (currentPage.length > 0) {
                    pages.push([...currentPage]);
                    currentPage = [];
                    currentChars = 0;
                }
                pages.push([item]);
                continue;
            }

            // Add the item to current page
            currentPage.push(item);
            currentChars += itemChars;

            // If we've reached the character limit, start a new page
            if (currentChars >= maxCharsPerPage) {
                pages.push([...currentPage]);
                currentPage = [];
                currentChars = 0;
            }
        }

        // Add any remaining items to the last page
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }

        return pages;
    }

    handleButtonPagination(buttons, pagination, textPagination) {
        let displayButtons = buttons;
        if (pagination) {
            const { currentPage, totalPages, itemsPerPage } = pagination;
            const startIndex = currentPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, buttons.length);
            displayButtons = buttons.slice(startIndex, endIndex);
            displayButtons = displayButtons.concat(this.getPaginationButtons(pagination));
        }
        return displayButtons;
    }

    handleBottomButtonPagination(bottomButtons, textPagination) {
        let displayBottomButtons = bottomButtons || [];
        if (textPagination) {
            displayBottomButtons = displayBottomButtons.concat(this.getTextPaginationButtons(textPagination));
        }
        return displayBottomButtons;
    }

    getTextPaginationButtons(textPagination) {
        const buttons = [];
        if (textPagination && Array.isArray(textPagination.text)) {
            const { currentPage = 0, text } = textPagination;
            const pages = this.calculateTextPages(text);
            const totalPages = pages.length;

            // Always show both navigation buttons, disable when not applicable
            buttons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: currentPage > 0 ? () => this.showDialog({ ...this.getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage - 1 } }) : () => {}
            });
            buttons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: currentPage < totalPages - 1 ? () => this.showDialog({ ...this.getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage + 1 } }) : () => {}
            });
        }
        return buttons;
    }

    getDialogParams() {
        // Return the current dialog parameters for pagination callbacks
        return this.currentDialogParams || {};
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
    }
}

export default DialogManager;