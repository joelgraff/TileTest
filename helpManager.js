import ContentProcessor from './ui/ContentProcessor.js';

/**
 * HelpManager - Handles help system and documentation display
 */
class HelpManager {
    constructor(scene, uiManager) {
        this.scene = scene;
        this.uiManager = uiManager;
        this.contentProcessor = new ContentProcessor();
        this.helpData = null;
        this.isHelpOpen = false;

        // Load help data
        this.loadHelpData();
    }

    /**
     * Load help data from help.md file
     */
    loadHelpData() {
        // Load help data from help.md
        fetch('help.md')
            .then(response => {
                console.log('Help fetch response:', response.status);
                return response.text();
            })
            .then(markdownContent => {
                console.log('Help markdown loaded, length:', markdownContent.length);
                this.helpData = this.contentProcessor.parseHelpMarkdown(markdownContent);
                console.log('Help data parsed:', this.helpData);
            })
            .catch(error => {
                console.error('Failed to load help data:', error);
                this.helpData = { topics: {} };
            });
    }

    /**
     * Toggle help dialog
     */
    toggleHelp() {
        if (this.isHelpOpen) {
            this.uiManager.closeDialog();
            this.isHelpOpen = false;
            return;
        }

        this.isHelpOpen = true;
        this.showHelpDialog();
    }

    /**
     * Show help dialog
     * @param {string} selectedTopic - Selected topic key
     */
    showHelpDialog(selectedTopic = null) {
        if (!this.helpData) {
            const dialogData = {
                title: 'Help',
                text: 'Loading help data...',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isHelpOpen = false;
                        this.uiManager.closeDialog();
                    }
                }
            };
            this.uiManager.showDialog(dialogData);
            return;
        }

        if (selectedTopic && this.helpData.topics[selectedTopic]) {
            // Show specific topic content
            this.showTopicContent(selectedTopic);
        } else {
            // Show topic selection
            this.showTopicSelection();
        }
    }

    /**
     * Show topic selection dialog
     */
    showTopicSelection() {
        const topics = this.helpData.topics;
        console.log('Help topics:', Object.keys(topics));
        console.log('Number of topics:', Object.keys(topics).length);

        // Create topic buttons
        const buttons = [];
        Object.keys(topics).forEach(topicKey => {
            const topic = topics[topicKey];
            console.log('Creating button for topic:', topicKey, 'title:', topic.title);
            buttons.push({
                label: topic.title,
                onClick: () => this.showHelpDialog(topicKey)
            });
        });

        console.log('Buttons created:', buttons.length);

        // Create dialog content object
        const dialogData = {
            title: 'Help Topics',
            text: 'Select a topic below to view detailed help information:',
            buttons: buttons,
            buttonStyle: 'link',
            buttonPosition: 'bottomLeft',
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.uiManager.closeDialog();
                }
            },
            exitButtonPosition: 'right'
        };

        this.uiManager.showDialog(dialogData);
    }

    /**
     * Show specific topic content
     * @param {string} topicKey - Topic key
     * @param {number} page - Page number
     */
    showTopicContent(topicKey, page = 0) {
        const topic = this.helpData.topics[topicKey];
        if (!topic || !topic.content || topic.content.length === 0) {
            // Fallback if topic is missing or empty
            const dialogData = {
                title: topic ? topic.title : 'Help',
                text: 'No help content available for this topic.',
                bottomButtons: [
                    {
                        label: 'Back to Topics',
                        onClick: () => this.showHelpDialog()
                    },
                    {
                        label: 'Close',
                        onClick: () => {
                            this.isHelpOpen = false;
                            this.uiManager.closeDialog();
                        }
                    }
                ]
            };
            this.uiManager.showDialog(dialogData);
            return;
        }

        // Use ContentProcessor for pagination
        const pages = this.contentProcessor.paginateText(topic.content.join('\n'), 8);
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);
        const displayText = pages[currentPage] || 'No help content available.';

        // Create left buttons (pagination + back button)
        const leftButtons = [];

        // Add pagination buttons if multiple pages
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: () => this.showTopicContent(topicKey, currentPage - 1),
                options: { width: 68 }
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: () => this.showTopicContent(topicKey, currentPage + 1),
                options: { width: 68 }
            });
        }

        // Add back button next to pagination
        leftButtons.push({
            label: 'Back to Topics',
            onClick: () => this.showHelpDialog()
        });

        // Create dialog content object
        const dialogData = {
            title: topic.title,
            text: displayText,
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isHelpOpen = false;
                    this.uiManager.closeDialog();
                }
            },
            exitButtonPosition: 'right'
        };

        this.uiManager.showDialog(dialogData);
    }

    /**
     * Handle input for help
     * @param {string} key - Key pressed
     * @returns {boolean} Handled input
     */
    handleInput(key) {
        if (key === 'H' || key === 'h') {
            this.toggleHelp();
            return true;
        }
        return false;
    }
}

export default HelpManager;