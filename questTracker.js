class QuestTracker {
    constructor(questManager) {
        this.questManager = questManager;
    }

    /**
     * Check if resolving a crisis completes any quest objectives
     */
    checkCrisisResolution(vendorId) {
        console.log(`Checking crisis resolution for vendor ${vendorId}`);
        let questCompleted = null;

        this.questManager.activeQuests.forEach(quest => {
            if (quest.type === 'save_npc') {
                quest.objectives.forEach(objective => {
                    if (!objective.resolved && objective.vendorId === vendorId) {
                        objective.resolved = true;
                        objective.resolvedAt = Date.now();
                        console.log(`Crisis resolved for quest ${quest.id} - vendor ${vendorId}`);

                        // Check if quest is complete
                        const allObjectivesComplete = quest.objectives.every(obj => obj.resolved);
                        if (allObjectivesComplete) {
                            this.completeQuest(quest.id);
                            questCompleted = quest;
                        }
                    }
                });
            }
        });

        if (questCompleted) {
            this.questManager.saveSessionState();
        }

        return questCompleted;
    }

    /**
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        console.log(`Checking item collection: ${itemName} from vendor ${vendorId}`);
        let questUpdated = false;

        this.questManager.activeQuests.forEach(quest => {
            if (quest.type === 'collection') {
                quest.objectives.forEach(objective => {
                    if (!objective.collected && objective.item.name === itemName && objective.vendorId === vendorId) {
                        objective.collected = true;
                        objective.vendor = vendorId;
                        questUpdated = true;
                        console.log(`Item ${itemName} collected for quest ${quest.id} from vendor ${vendorId}`);

                        // Check if quest is complete
                        const allObjectivesComplete = quest.objectives.every(obj => obj.collected);
                        if (allObjectivesComplete) {
                            this.completeQuest(quest.id);
                        }
                    }
                });
            }
        });

        if (questUpdated) {
            this.questManager.saveSessionState();
        }

        return questUpdated;
    }

    /**
     * Complete a quest and award rewards
     */
    completeQuest(questId) {
        const questIndex = this.questManager.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        const quest = this.questManager.activeQuests[questIndex];
        quest.completed = true;
        quest.completedAt = Date.now();

        // Move to completed quests
        this.questManager.completedQuests.push(quest);
        this.questManager.activeQuests.splice(questIndex, 1);

        // Award points
        if (this.questManager.uiManager && quest.reward) {
            this.questManager.uiManager.updateScore(quest.reward.points);
            this.questManager.uiManager.showQuestCompletion(quest);
        }

        console.log('Quest completed:', quest.title);
        this.questManager.saveSessionState();
    }

    /**
     * Get active quests for display
     */
    getActiveQuests() {
        return this.questManager.activeQuests;
    }

    /**
     * Get completed quests for display
     */
    getCompletedQuests() {
        return this.questManager.completedQuests;
    }

    /**
     * Get quest progress summary
     */
    getQuestSummary() {
        return {
            sessionId: this.questManager.sessionId,
            activeCount: this.questManager.activeQuests.length,
            completedCount: this.questManager.completedQuests.length,
            totalPoints: this.questManager.completedQuests.reduce((sum, quest) => sum + (quest.reward?.points || 0), 0)
        };
    }
}

export default QuestTracker;