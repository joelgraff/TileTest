/**
 * QuestManager.js
 * Handles procedural quest generation and management for the VCF Midwest game.
 * Uses domain-based architecture for scalable, replayable quests.
 */

import DomainManager from './domainManager.js';

class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.sessionId = null;
        this.domainManager = null;
        this.npcManager = null;
        this.uiManager = null;
    }

    /**
     * Initialize the quest manager with required dependencies
     */
    init(vendors, uiManager, scene) {
        this.vendors = vendors;
        this.uiManager = uiManager;
        this.scene = scene;

        // Load session state from cookies
        this.loadSessionState();

        // Wait for DomainManager to load, then start session
        this.waitForDomainsAndStart();

        console.log('QuestManager initialized, waiting for domains...');
    }

    /**
     * Wait for DomainManager to load domains, then start quest session
     */
    async waitForDomainsAndStart() {
        try {
            await DomainManager.loadDomains();
            console.log('DomainManager ready, starting quest session');

            // Start new session if none exists
            if (!this.sessionId) {
                this.startNewSession();
            }
        } catch (error) {
            console.error('Failed to load domains for quest system:', error);
        }
    }

    /**
     * Start a new quest session
     */
    startNewSession() {
        this.sessionId = 'session_' + Date.now();
        this.activeQuests = [];
        this.completedQuests = [];

        // Generate initial quests
        this.generateInitialQuests();

        // Save session state
        this.saveSessionState();

        console.log('New quest session started:', this.sessionId);
    }

    /**
     * Generate initial quests for the session
     */
    generateInitialQuests() {
        // For Phase 1B, start with one basic collection quest
        const collectionQuest = this.generateCollectionQuest();
        if (collectionQuest) {
            this.activeQuests.push(collectionQuest);
        }
    }

    /**
     * Generate a basic collection quest
     */
    generateCollectionQuest() {
        // Get available domains
        const domains = DomainManager.getAllDomains();
        if (!domains || domains.length === 0) {
            console.warn('No domains available for quest generation');
            return null;
        }

        // Select a random domain
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];

        // Get items from this domain
        const domainItems = DomainManager.getDomainItems(randomDomain.id);
        if (!domainItems || domainItems.length === 0) {
            console.warn('No items available in domain:', randomDomain.id);
            return null;
        }

        // Select 3 random items from the domain
        const selectedItems = this.shuffleArray(domainItems).slice(0, Math.min(3, domainItems.length));

        // Get vendors in this domain (for now, use all vendors - will be limited to active set later)
        const domainVendors = this.vendors.filter(vendor =>
            vendor.domain_id === randomDomain.id
        );

        if (domainVendors.length === 0) {
            console.warn('No vendors in domain:', randomDomain.id);
            return null;
        }

        // Create quest object
        const quest = {
            id: 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'collection',
            domain: randomDomain.id,
            title: `Collect ${randomDomain.name} Treasures`,
            description: `Find and collect these items from ${randomDomain.name} vendors: ${selectedItems.map(item => item.name).join(', ')}`,
            objectives: selectedItems.map(item => ({
                item: item,
                collected: false,
                vendor: null // Will be set when collected
            })),
            reward: {
                points: selectedItems.length * 10,
                description: `${selectedItems.length * 10} points for collecting ${randomDomain.name} items`
            },
            created: Date.now(),
            completed: false
        };

        return quest;
    }

    /**
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        let questUpdated = false;

        this.activeQuests.forEach(quest => {
            if (quest.type === 'collection') {
                quest.objectives.forEach(objective => {
                    if (!objective.collected && objective.item.name === itemName) {
                        objective.collected = true;
                        objective.vendor = vendorId;
                        questUpdated = true;

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
            this.saveSessionState();
        }

        return questUpdated;
    }

    /**
     * Complete a quest and award rewards
     */
    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        const quest = this.activeQuests[questIndex];
        quest.completed = true;
        quest.completedAt = Date.now();

        // Move to completed quests
        this.completedQuests.push(quest);
        this.activeQuests.splice(questIndex, 1);

        // Award points
        if (this.uiManager && quest.reward) {
            this.uiManager.addScore(quest.reward.points);
            this.uiManager.showQuestCompletion(quest);
        }

        console.log('Quest completed:', quest.title);
        this.saveSessionState();
    }

    /**
     * Get active quests for display
     */
    getActiveQuests() {
        return this.activeQuests;
    }

    /**
     * Get completed quests for display
     */
    getCompletedQuests() {
        return this.completedQuests;
    }

    /**
     * Save session state to cookies
     */
    saveSessionState() {
        const sessionData = {
            sessionId: this.sessionId,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            timestamp: Date.now()
        };

        // Save to cookie (expires in 24 hours)
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        document.cookie = `vcf_quest_session=${JSON.stringify(sessionData)}; expires=${expires.toUTCString()}; path=/`;
    }

    /**
     * Load session state from cookies
     */
    loadSessionState() {
        const cookieName = 'vcf_quest_session=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(cookieName)) {
                try {
                    const sessionData = JSON.parse(cookie.substring(cookieName.length));
                    this.sessionId = sessionData.sessionId;
                    this.activeQuests = sessionData.activeQuests || [];
                    this.completedQuests = sessionData.completedQuests || [];
                    console.log('Loaded quest session:', this.sessionId);
                    return;
                } catch (e) {
                    console.warn('Failed to parse quest session cookie:', e);
                }
            }
        }

        // No valid session found, will create new one when needed
        console.log('No valid quest session found');
    }

    /**
     * Clear session state (for testing/debugging)
     */
    clearSession() {
        this.sessionId = null;
        this.activeQuests = [];
        this.completedQuests = [];

        // Clear cookie
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        console.log('Quest session cleared');
    }

    /**
     * Utility function to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get quest progress summary
     */
    getQuestSummary() {
        return {
            sessionId: this.sessionId,
            activeCount: this.activeQuests.length,
            completedCount: this.completedQuests.length,
            totalPoints: this.completedQuests.reduce((sum, quest) => sum + (quest.reward?.points || 0), 0)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestManager;
}

export default QuestManager;