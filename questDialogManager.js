import ContentProcessor from './ui/ContentProcessor.js';

/**
 * QuestDialogManager - Handles quest UI display and interaction
 */
class QuestDialogManager {
    constructor(scene, uiManager) {
        this.scene = scene;
        this.uiManager = uiManager;
        this.contentProcessor = new ContentProcessor();
        this.isQuestsOpen = false;
    }

    /**
     * Toggle quest dialog
     */
    toggleQuests() {
        if (this.isQuestsOpen) {
            this.uiManager.closeDialog();
            this.isQuestsOpen = false;
            return;
        }

        this.isQuestsOpen = true;
        this.showQuestDialog();
    }

    /**
     * Show quest dialog with pagination
     * @param {number} page - Page number to display
     */
    showQuestDialog(page = 0) {
        if (!this.scene.questManager) {
            const dialogData = {
                title: 'Quests',
                text: 'Quest system not available',
                exitButton: {
                    label: 'Close',
                    onClick: () => {
                        this.isQuestsOpen = false;
                        this.uiManager.closeDialog();
                    }
                }
            };
            this.uiManager.showDialog(dialogData);
            return;
        }

        const activeQuests = this.scene.questManager.getActiveQuests();
        const completedQuests = this.scene.questManager.getCompletedQuests();

        // Create quest list for pagination
        const questItems = [];
        if (activeQuests.length > 0) {
            questItems.push('=== ACTIVE QUESTS ===');
            activeQuests.forEach((quest, index) => {
                questItems.push(`\n${index + 1}. ${quest.title}`);
                questItems.push(`\n${quest.description}`);
                const completedObjectives = quest.objectives.filter(obj => obj.collected).length;
                const totalObjectives = quest.objectives.length;
                questItems.push(`\nProgress: ${completedObjectives}/${totalObjectives} items collected`);
                questItems.push('');
            });
        } else {
            questItems.push('No active quests');
            questItems.push('');
        }

        // Add completed quests
        if (completedQuests.length > 0) {
            questItems.push('=== COMPLETED QUESTS ===');
            completedQuests.forEach((quest, index) => {
                questItems.push(`\n${index + 1}. ${quest.title}`);
                questItems.push(`\n${quest.description}`);
                questItems.push('');
            });
        }

        const pages = this.contentProcessor.paginateText(questItems.join('\n'), 9);
        const totalPages = pages.length;
        const currentPage = Math.min(page, totalPages - 1);
        const displayText = pages[currentPage] || 'No quest information available.';

        // Create pagination buttons if needed
        const leftButtons = [];
        if (totalPages > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: () => this.showQuestDialog(currentPage - 1)
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: () => this.showQuestDialog(currentPage + 1)
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Quests',
            text: displayText,
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            exitButton: {
                label: 'Close',
                onClick: () => {
                    this.isQuestsOpen = false;
                    this.uiManager.closeDialog();
                }
            }
        };

        this.uiManager.showDialog(dialogData);
    }

    /**
     * Show quest completion dialog
     * @param {Object} quest - Completed quest object
     */
    showQuestCompletion(quest) {
        const dialogData = {
            title: 'Quest Completed!',
            text: `${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`,
            exitButton: {
                label: 'Great!',
                onClick: () => this.uiManager.closeDialog()
            }
        };

        this.uiManager.showDialog(dialogData);

        // Update quest display if it's open
        if (this.isQuestsOpen) {
            // Refresh the quest dialog if it's currently open
            this.showQuestDialog();
        }
    }

    /**
     * Handle input for quests
     * @param {string} key - Key pressed
     * @returns {boolean} Handled input
     */
    handleInput(key) {
        if (key === 'Q' || key === 'q') {
            this.toggleQuests();
            return true;
        }
        return false;
    }
}

export default QuestDialogManager;