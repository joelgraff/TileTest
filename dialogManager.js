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

    showDialog({ imageKey, title = '', text = '', buttons = [], leftButtons = [], exitButton = null, pagination = null, bottomButtons = null, textPagination = null, useLinkButtons = false }) {
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

        // Store dialog parameters for pagination callbacks
        this.currentDialogParams = { imageKey, title, text, buttons, leftButtons, exitButton, pagination, bottomButtons, textPagination, useLinkButtons };

        // Initialize the layout system first
        this.dialogLayout = new DialogLayout(this.scene, cam.width / 2, cam.height - dialogHeight / 2 - 16, dialogWidth, dialogHeight);

        // Create overlay and container using the layout system
        this.overlay = this.createOverlay(cam);
        this.dialogContainer = this.createContainer(cam, dialogWidth, dialogHeight);

        // Create dialog structure
        this.renderBackground(dialogWidth, dialogHeight);
        this.renderTitleBar(title, dialogWidth, dialogHeight);
        this.renderNpcImage(imageKey, dialogWidth, dialogHeight);
        this.renderDialogText(this.handleTextPagination(text, textPagination), dialogWidth, dialogHeight, leftButtons && leftButtons.length > 0);
        this.renderButtons(this.handleButtonPagination(buttons, pagination, textPagination), useLinkButtons);
        this.renderLeftButtons(leftButtons);
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

    renderDialogText(displayText, dialogWidth, dialogHeight, hasLeftButtons = false) {
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
        this.dialogLayout.setText(dialogText, hasLeftButtons);
    }

    renderButtons(displayButtons, useLinkButtons = false) {
        if (useLinkButtons) {
            this.dialogLayout.createLinkButtons(displayButtons);
        } else {
            this.dialogLayout.createButtons(displayButtons);
        }
    }

    renderLeftButtons(leftButtons) {
        if (!leftButtons || leftButtons.length === 0) return;
        this.dialogLayout.createLeftButtons(leftButtons);
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
     * Calculate pages of text based on line and character limits, keeping topics together
     * @param {Array<string>} textArray - Array of text items to paginate
     * @param {number} maxLines - Maximum lines per page (default: 25)
     * @returns {Array<Array<string>>} Array of pages, each containing an array of text items
     */
    calculateTextPages(textArray, maxLines = 25) {
        console.log(`Max Lines = ${maxLines},Text Array: ${textArray}`);
        // For help content, use topic-aware pagination
        if (this.isHelpContent(textArray)) {

            return this.calculateTopicPages(textArray, maxLines);
        }

        // Default pagination for other content
        return this.calculateSimpleTextPages(textArray, maxLines);
    }

    /**
     * Check if content appears to be help content (has topic headers)
     * @param {Array<string>} textArray - Array of text items
     * @returns {boolean} True if this looks like help content
     */
    isHelpContent(textArray) {
        // Check if any line is all caps and looks like a header
        return textArray.some(line =>
            line.length > 0 &&
            line === line.toUpperCase() &&
            !line.includes('•') &&
            !line.startsWith(' ') &&
            line.length < 50 // Reasonable header length
        );
    }

    /**
     * Calculate pages keeping complete topics together
     * @param {Array<string>} textArray - Array of text items
     * @param {number} maxLines - Maximum lines per page
     * @returns {Array<Array<string>>} Array of pages
     */
    calculateTopicPages(textArray, maxLines) {
        const pages = [];
        let i = 0;
        console.log(`Starting topic pagination with maxLines=${maxLines}`);
        console.log(`Text Array: ${textArray}`);
        while (i < textArray.length) {
            const item = textArray[i];
            console.log(`Processing textarray item ${i}: ${item}`);
            if (this.isTopicHeader(item)) {
                // This is a topic header - collect the entire topic
                const topicItems = this.collectTopic(textArray, i);

                console.log(`Processing topic: ${topicItems}`);
                // Recursively process the topic content to handle subtopics
                const topicPages = this.paginateTopicContent(topicItems, maxLines);
                pages.push(...topicPages);

                i += topicItems.length;
            } else {
                // Shouldn't happen in well-formed help content, but handle it
                pages.push([item]);
                i++;
            }
        }

        return pages;
    }

    /**
     * Recursively paginate topic content, treating subtopics as topics
     * @param {Array<string>} topicItems - Items in the topic (header + content)
     * @param {number} maxLines - Maximum lines per page
     * @returns {Array<Array<string>>} Array of pages for this topic
     */
    paginateTopicContent(topicItems, maxLines) {
        const pages = [];
        const charsPerLine = 36;
        const maxCharsPerPage = maxLines * charsPerLine;

        let i = 0;

        while (i < topicItems.length) {
            const item = topicItems[i];

            if (this.isTopicHeader(item)) {
                // This is a header (main topic or subtopic) - collect the entire section
                const sectionItems = this.collectTopic(topicItems, i);
                const sectionChars = this.calculateTopicChars(sectionItems);

                // If the section fits on one page, keep it together
                if (sectionChars <= maxCharsPerPage) {
                    pages.push(sectionItems);
                } else {
                    // Section is too long - split it across multiple pages
                    const sectionPages = this.splitLargeTopic(sectionItems, maxLines);
                    pages.push(...sectionPages);
                }

                i += sectionItems.length;
            } else {
                // Content that doesn't belong to any header - this shouldn't happen in well-formed content
                // Add it to the last page if one exists, otherwise create a new page
                if (pages.length > 0) {
                    pages[pages.length - 1].push(item);
                } else {
                    pages.push([item]);
                }
                i++;
            }
        }

        return pages;
    }    /**
     * Check if a line appears to be a topic header
     * @param {string} line - Text line to check
     * @returns {boolean} True if this looks like a topic header
     */
    isTopicHeader(line) {
        return line.length > 0 &&
               line === line.toUpperCase() &&
               !line.includes('•') &&
               !line.startsWith(' ') &&
               line.length < 50;
    }

    /**
     * Collect all items belonging to a topic starting at the given index
     * @param {Array<string>} textArray - Full text array
     * @param {number} startIndex - Index of the topic header
     * @returns {Array<string>} Array of items for this topic
     */
    collectTopic(textArray, startIndex) {
        const topicItems = [];
        let i = startIndex;

        // Add the header
        topicItems.push(textArray[i++]);

        // Collect content until next header or end
        while (i < textArray.length) {
            const line = textArray[i];
            if (this.isTopicHeader(line)) {
                break; // Stop at next header
            }
            topicItems.push(line);
            i++;
        }

        return topicItems;
    }

    /**
     * Calculate total characters for a topic
     * @param {Array<string>} topicItems - Items in the topic
     * @returns {number} Total character count
     */
    calculateTopicChars(topicItems) {
        return topicItems.reduce((total, item) => total + item.length, 0);
    }

    /**
     * Split a large topic/subtopic across multiple pages
     * @param {Array<string>} topicItems - Items in the topic/subtopic
     * @param {number} maxLines - Maximum lines per page
     * @returns {Array<Array<string>>} Array of pages for this topic
     */
    splitLargeTopic(topicItems, maxLines) {
        const pages = [];
        const charsPerLine = 36;
        const maxCharsPerPage = maxLines * charsPerLine;

        // First page gets the header
        const firstPage = [topicItems[0]]; // Header
        let currentChars = topicItems[0].length;
        let pageStartIndex = 1; // Skip header for content

        console.log(topicItems, currentChars, maxCharsPerPage, maxLines, charsPerLine);
        // Fill first page with as much content as possible
        for (let i = 1; i < topicItems.length; i++) {
            const item = topicItems[i];
            const itemChars = item.length;

            if (currentChars + itemChars > maxCharsPerPage) {
                break;
            }

            firstPage.push(item);
            currentChars += itemChars;
            pageStartIndex = i + 1;
        }

        pages.push(firstPage);

        // Create subsequent pages for remaining content
        if (pageStartIndex < topicItems.length) {
            const remainingItems = topicItems.slice(pageStartIndex);
            const remainingPages = this.calculateSimpleTextPages(remainingItems, maxLines);
            pages.push(...remainingPages);
        }

        return pages;
    }

    /**
     * Simple character-based pagination (original method)
     * @param {Array<string>} textArray - Array of text items
     * @param {number} maxLines - Maximum lines per page
     * @returns {Array<Array<string>>} Array of pages
     */
    calculateSimpleTextPages(textArray, maxLines = 25) {
        const pages = [];
        const charsPerLine = 36;
        const maxCharsPerPage = maxLines * charsPerLine;

        let currentPage = [];
        let currentChars = 0;

        for (const item of textArray) {
            const itemChars = item.length;

            if (currentChars + itemChars > maxCharsPerPage && currentPage.length > 0) {
                pages.push([...currentPage]);
                currentPage = [];
                currentChars = 0;
            }

            if (itemChars > maxCharsPerPage) {
                if (currentPage.length > 0) {
                    pages.push([...currentPage]);
                    currentPage = [];
                    currentChars = 0;
                }
                pages.push([item]);
                continue;
            }

            currentPage.push(item);
            currentChars += itemChars;

            if (currentChars >= maxCharsPerPage) {
                pages.push([...currentPage]);
                currentPage = [];
                currentChars = 0;
            }
        }

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

            // Only show navigation buttons if there are multiple pages
            if (totalPages > 1) {
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

        // If pointer is still down when dialog closes, ignore subsequent pointer events until release
        if (this.scene.inputManager && this.scene.input.activePointer.isDown) {
            this.scene.inputManager.ignorePointerUntilRelease = true;
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