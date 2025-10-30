/**
 * QuestManager.js
 * Handles procedural quest generation and management for the VCF Midwest game.
 * Uses domain-based architecture for scalable, replayable quests.
 */

import QuestSession from './questSession.js';
import QuestGenerator from './questGenerator.js';
import QuestTracker from './questTracker.js';
import QuestStorage from './questStorage.js';

class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.sessionId = null;
        this.vendors = [];

        // Initialize sub-modules
        this.session = new QuestSession(this);
        this.generator = new QuestGenerator(this);
        this.tracker = new QuestTracker(this);
        this.storage = new QuestStorage(this);
    }

    /**
     * Initialize the quest manager with required dependencies
     */
    init(vendors, uiManager, scene) {
        this.vendors = vendors;
        this.uiManager = uiManager;
        this.scene = scene;

        this.session.init(vendors, uiManager, scene);
    }

    /**
     * Generate initial quests for the session
     */
    generateInitialQuests() {
        this.generator.generateInitialQuests();
    }

    /**
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        return this.tracker.checkItemCollection(itemName, vendorId);
    }

    /**
     * Complete a quest and award rewards
     */
    completeQuest(questId) {
        this.tracker.completeQuest(questId);
    }

    /**
     * Get active quests for display
     */
    getActiveQuests() {
        return this.tracker.getActiveQuests();
    }

    /**
     * Get completed quests for display
     */
    getCompletedQuests() {
        return this.tracker.getCompletedQuests();
    }

    /**
     * Save session state to cookies
     */
    saveSessionState() {
        this.storage.saveSessionState();
    }

    /**
     * Load session state from cookies
     */
    loadSessionState() {
        this.storage.loadSessionState();
    }

    /**
     * Clear session state (for testing/debugging)
     */
    clearSession() {
        this.session.clearSession();
    }

    /**
     * Get quest progress summary
     */
    getQuestSummary() {
        return this.tracker.getQuestSummary();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestManager;
}

export default QuestManager;