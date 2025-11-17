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
     * Show quest dialog with pagination - one quest per page
     * @param {number} page - Quest page number to display (0-indexed)
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
        const allQuests = [...activeQuests, ...completedQuests];

        if (allQuests.length === 0) {
            const dialogData = {
                title: 'Quests',
                text: 'No quests available',
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

        // Clamp page to valid range
        const currentPage = Math.max(0, Math.min(page, allQuests.length - 1));
        const currentQuest = allQuests[currentPage];

        // Format current quest display
        const questText = [];
        const isCompleted = completedQuests.includes(currentQuest);

        // Add title with reward in parentheses
        questText.push(`${currentQuest.title} (${currentQuest.reward.points} pts)`);
        if (isCompleted) {
            questText.push('✓ COMPLETED');
        }
        questText.push('');
        questText.push(currentQuest.description);
        questText.push('');

        // Show progress based on quest type
        if (currentQuest.type === 'save_npc') {
            const completedObjectives = currentQuest.objectives.filter(obj => obj.resolved).length;
            const totalObjectives = currentQuest.objectives.length;
            questText.push(`Progress: ${completedObjectives}/${totalObjectives} vendor${totalObjectives > 1 ? 's' : ''} helped`);
        } else {
            const completedObjectives = currentQuest.objectives.filter(obj => obj.collected).length;
            const totalObjectives = currentQuest.objectives.length;
            questText.push(`Progress: ${completedObjectives}/${totalObjectives} items collected`);

            // List items to collect
            if (currentQuest.objectives.length > 0) {
                questText.push('');
                questText.push('Items to collect:');
                currentQuest.objectives.forEach(obj => {
                    const status = obj.collected ? '✓' : '○';
                    questText.push(`  ${status} ${obj.item.name}`);
                });
            }
        }

        // Create pagination buttons
        const leftButtons = [];
        if (allQuests.length > 1) {
            leftButtons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: () => this.showQuestDialog(currentPage - 1)
            });
            leftButtons.push({
                label: `${currentPage + 1}/${allQuests.length}`,
                disabled: true,
                options: { style: 'link' }
            });
            leftButtons.push({
                label: '>',
                disabled: currentPage >= allQuests.length - 1,
                onClick: () => this.showQuestDialog(currentPage + 1)
            });
        }

        // Create dialog content object
        const dialogData = {
            title: 'Quests',
            text: questText.join('\n'),
            leftButtons: leftButtons.length > 0 ? leftButtons : undefined,
            isQuestDialog: true, // Flag to indicate special layout for quests
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